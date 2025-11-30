"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";


export function ProfileImage({ user = {}, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [localUrl, setLocalUrl] = useState(user.profile?.avatar ?? user.avatar ?? "");
  const fileInputRef = useRef(null);

  const MAX_INPUT_SIZE = 10 * 1024 * 1024; // allow up to 10MB input but will compress
  const MAX_STORE_SIZE = 2 * 1024 * 1024; // try to keep fallback <= 2MB
  const MAX_WIDTH = 1024; // max width for resized fallback

  const toDataUrlAndResize = (file, maxWidth = MAX_WIDTH, quality = 0.8) => {
    // returns Promise<string> dataURL
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onerror = (e) => reject(new Error("Failed to read file"));
      reader.onload = (ev) => {
        img.onload = () => {
          // compute target size
          const ratio = img.width > maxWidth ? maxWidth / img.width : 1;
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * ratio);
          canvas.height = Math.round(img.height * ratio);
          const ctx = canvas.getContext("2d");
          // draw
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          // compress to JPEG (fallback) — keep PNG if original has transparency
          const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
          const dataUrl = canvas.toDataURL(mime, quality);
          resolve(dataUrl);
        };
        img.onerror = (e) => reject(new Error("Failed to load image for resize"));
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    // basic validate
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    if (file.size > MAX_INPUT_SIZE) {
      alert(`Please choose an image smaller than ${MAX_INPUT_SIZE / (1024 * 1024)} MB.`);
      return;
    }

    setUploading(true);
    try {
      // prepare path
      const timestamp = Date.now();
      const safeName = file.name.replace(/\s+/g, "_");
      const filePath = `${user.id ?? "anon"}/${timestamp}_${safeName}`;

      // Attempt storage upload (primary)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { cacheControl: "3600", upsert: true });

      if (!uploadError && uploadData?.path) {
        // try to obtain public url (public bucket) or signed url
        let publicUrl = null;
        try {
          const { data: publicData, error: publicErr } = await supabase.storage
            .from("avatars")
            .getPublicUrl(uploadData.path);

          if (!publicErr && publicData?.publicUrl) {
            publicUrl = publicData.publicUrl;
          } else {
            // fallback to signed url (1 hour)
            const { data: signedData, error: signedErr } = await supabase.storage
              .from("avatars")
              .createSignedUrl(uploadData.path, 3600);
            if (!signedErr && signedData?.signedUrl) publicUrl = signedData.signedUrl;
          }
        } catch (err) {
          console.warn("Error getting URL for uploaded file:", err);
        }

        if (!publicUrl) {
          // still okay — we'll use path for now (but prefer URL)
          publicUrl = `${supabase.storageUrl ?? ""}/object/public/assests/${uploadData.path}`;
        }

        // update preview and DB
        setLocalUrl(publicUrl);

        // persist avatar url into DB if user id exists
        if (user?.id) {
          const { error: updateErr } = await supabase
            .from("student_list")
            .update({ avatar: publicUrl })
            .eq("id", user.id);
          if (updateErr) console.warn("Failed to persist avatar url to DB:", updateErr);
        }

        if (typeof onUpdate === "function") {
          try {
            await onUpdate({ profile: { avatar: publicUrl }, avatar: publicUrl });
          } catch (err) {
            console.warn("onUpdate callback error:", err);
          }
        }

        return; // done
      }

      // If we land here uploadError exists — check if bucket not found
      const isBucketNotFound =
        uploadError &&
        (uploadError.message?.toLowerCase().includes("bucket not found") ||
          uploadError.status === 404 ||
          uploadError.statusCode === "404");

      if (!uploadError) {
        throw new Error("Upload failed for unknown reason");
      }

      if (!isBucketNotFound) {
        // other upload errors — show and stop
        throw uploadError;
      }

      // --- FALLBACK PATH (bucket missing) ---
      // resize+compress and convert to data URL
      const dataUrl = await toDataUrlAndResize(file, MAX_WIDTH, 0.8);

      // if dataUrl too big, attempt stronger compression
      let finalDataUrl = dataUrl;
      const approxSize = Math.ceil((dataUrl.length - "data:image/jpeg;base64,".length) * 3 / 4);
      if (approxSize > MAX_STORE_SIZE) {
        // attempt stronger compression by reducing quality
        const reduced = await toDataUrlAndResize(file, Math.min(MAX_WIDTH, 800), 0.6);
        finalDataUrl = reduced;
      }

      // optional confirm if huge
      const finalSize = Math.ceil((finalDataUrl.length - finalDataUrl.indexOf(",") - 1) * 3 / 4);
      if (finalSize > 5 * 1024 * 1024) {
        // too large even after compression
        throw new Error("Image is too large to store as a fallback. Please create the 'avatars' bucket in Supabase Storage or choose a smaller image.");
      }

      // Persist fallback into DB avatar column
      if (user?.id) {
        const { data: updatedRow, error: updateErr } = await supabase
          .from("student_list")
          .update({ avatar: finalDataUrl })
          .eq("id", user.id)
          .select()
          .single();

        if (updateErr) {
          // final fallback: still set preview and call onUpdate - but warn
          console.warn("Fallback: failed to write data-url avatar to DB:", updateErr);
        } else if (updatedRow?.avatar) {
          setLocalUrl(updatedRow.avatar);
        }
      }

      // update preview & notify parent
      setLocalUrl(finalDataUrl);
      if (typeof onUpdate === "function") {
        try {
          await onUpdate({ profile: { avatar: finalDataUrl }, avatar: finalDataUrl });
        } catch (err) {
          console.warn("onUpdate callback error (fallback):", err);
        }
      }

      alert("Profile Pic updated");
    } catch (err) {
      console.error("Upload/ fallback error:", err);
      alert(err?.message || "Upload failed — check console for details.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  return (
    <div className="relative group">
      <Avatar className="h-24 w-24">
        <AvatarImage src={localUrl || ""} alt={user.firstName || "Avatar"} />
        <AvatarFallback>{user.initials || "NA"}</AvatarFallback>
      </Avatar>

      <Button
        variant="outline"
        size="icon"
        className="rounded-full absolute bottom-0 right-0"
        onClick={triggerFileInput}
        disabled={uploading}
      >
        {uploading ? "..." : "📷"}
      </Button>

      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleImageUpload}
      />
    </div>
  );
}
