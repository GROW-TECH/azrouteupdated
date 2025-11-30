'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function ClassList() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // ⬇️ Added class_type in formData
  const [formData, setFormData] = useState({
    coach: '',
    class_name: '',
    status: '',
    hour: '10',
    minute: '00',
    ampm: 'AM',
    level: '',
    date: '',
    meet_link: '',
    class_type: 'group', // NEW FIELD
  });

  const [coachOptions, setCoachOptions] = useState([]);
  const [classNameOptions, setClassNameOptions] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [sharedClass, setSharedClass] = useState(null);

  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [userSession, setUserSession] = useState(null);
  const [isSessionChecked, setIsSessionChecked] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchCoachOptions();
    fetchClassNameOptions();
    checkUserAndGoogleConnection();
  }, []);

  const checkUserAndGoogleConnection = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      setUserSession(session);

      if (error || !session?.user) {
        setIsGoogleConnected(false);
        setIsSessionChecked(true);
        return;
      }

      const { data, error: tokenError } = await supabase
        .from('google_integrations')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      const connected = !!data && !tokenError;
      setIsGoogleConnected(connected);
      setIsSessionChecked(true);
    } catch (err) {
      setIsGoogleConnected(false);
      setIsSessionChecked(true);
    }
  };

  const fetchClasses = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('classlist')
      .select('*')
      .order('id', { ascending: false });

    setClasses(data || []);
    setLoading(false);
  };

  const fetchCoachOptions = async () => {
    const { data } = await supabase.from('coaches').select('name, coach_display_id');
    setCoachOptions(data || []);
  };

  const fetchClassNameOptions = async () => {
    const { data } = await supabase.from('coaches').select('specialty');
    if (Array.isArray(data)) {
      const unique = [...new Set(data.map(c => c.specialty).filter(Boolean))];
      setClassNameOptions(unique);
    }
  };

  const handleAddClick = () => {
    setEditingId(null);
    setFormData({
      coach: '',
      class_name: '',
      status: '',
      hour: '10',
      minute: '00',
      ampm: 'AM',
      level: '',
      date: '',
      meet_link: '',
      class_type: 'group', // reset
    });
    setShowForm(true);
  };

  const handleEditClick = (cls) => {
    let hour = '10', minute = '00', ampm = 'AM';

    if (cls.time) {
      const parts = cls.time.split(':');
      let hInt = parseInt(parts[0], 10);

      minute = parts[1];
      if (hInt >= 12) {
        ampm = 'PM';
        hour = (hInt === 12 ? 12 : hInt - 12).toString().padStart(2, '0');
      } else {
        ampm = 'AM';
        hour = (hInt === 0 ? 12 : hInt).toString().padStart(2, '0');
      }
    }

    setEditingId(cls.id);
    setFormData({
      coach: cls.coach_id ?? cls.coach,
      class_name: cls.class_name,
      status: cls.status,
      hour,
      minute,
      ampm,
      level: cls.level,
      date: cls.date,
      meet_link: cls.meet_link || '',
      class_type: cls.class_type || 'group', // NEW FIELD
    });

    setShowForm(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const convertTo24Hour = (hour, minute, ampm) => {
    let h = parseInt(hour, 10);
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${minute}`;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!formData.coach || !formData.class_name || !formData.status || !formData.date) {
      alert("All fields are required.");
      return;
    }

    const time24 = convertTo24Hour(formData.hour, formData.minute, formData.ampm);

    const selectedCoach = coachOptions.find(c => c.coach_display_id === formData.coach);
    if (!selectedCoach) return alert("Invalid coach selected.");

    const dbRecord = {
      coach: selectedCoach.name,
      coach_id: formData.coach,
      class_name: formData.class_name,
      status: formData.status,
      time: time24,
      level: formData.level,
      date: formData.date,
      meet_link: formData.meet_link,
      class_type: formData.class_type, // NEW FIELD
    };

    if (editingId) {
      await supabase.from('classlist').update(dbRecord).eq('id', editingId);
    } else {
      await supabase.from('classlist').insert([dbRecord]);
    }

    setShowForm(false);
    fetchClasses();
  };

  const handleDeleteClick = async (id) => {
    if (!confirm("Delete class?")) return;
    await supabase.from('classlist').delete().eq('id', id);
    fetchClasses();
  };

  const handleShareClick = (cls) => {
    setSharedClass(cls);
    setShowShareModal(true);
  };

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h4 fw-bold">Class List</h2>
        <button onClick={handleAddClick} className="btn btn-success">+ Add Class</button>
      </div>

      {/* ================= FORM MODAL ================= */}
      {showForm && (
        <div className="modal fade show d-block custom-modal-overlay">
          <div className="modal-dialog">
            <div className="modal-content shadow custom-modal-content">
              <div className="modal-header custom-modal-header">
                <h5 className="modal-title">{editingId ? 'Edit Class' : 'Add Class'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowForm(false)} />
              </div>

              <form onSubmit={handleFormSubmit}>
                <div className="modal-body custom-modal-body">

                  {/* CLASS TYPE FIELD */}
                  <div className="mb-3">
                    <label className="form-label">Class Type</label>
                    <select
                      className="form-select"
                      name="class_type"
                      required
                      value={formData.class_type}
                      onChange={handleInputChange}
                    >
                      <option value="group">Group Class</option>
                      <option value="individual">Individual Class</option>
                    </select>
                  </div>

                  {/* Existing fields continue below */}
                  <div className="mb-3">
                    <label className="form-label">Coach</label>
                    <select
                      className="form-select"
                      name="coach"
                      required
                      value={formData.coach}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Coach</option>
                      {coachOptions.map((c, i) => (
                        <option key={i} value={c.coach_display_id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Class Name</label>
                    <select
                      className="form-select"
                      name="class_name"
                      required
                      value={formData.class_name}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Class</option>
                      {classNameOptions.map((cls, i) => (
                        <option key={i} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      name="status"
                      required
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Status</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Live">Live</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Time</label>
                    <div className="d-flex gap-2">
                      <select name="hour" className="form-select" value={formData.hour} onChange={handleInputChange}>
                        {Array.from({ length: 12 }, (_, i) => {
                          const v = (i + 1).toString().padStart(2, '0');
                          return <option key={i} value={v}>{v}</option>;
                        })}
                      </select>

                      <select name="minute" className="form-select" value={formData.minute} onChange={handleInputChange}>
                        {Array.from({ length: 60 }, (_, i) => {
                          const v = i.toString().padStart(2, '0');
                          return <option key={i} value={v}>{v}</option>;
                        })}
                      </select>

                      <select name="ampm" className="form-select" value={formData.ampm} onChange={handleInputChange}>
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Level</label>
                    <select
                      className="form-select"
                      name="level"
                      required
                      value={formData.level}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Level</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Date</label>
                    <input type="date" className="form-control" required name="date" value={formData.date} onChange={handleInputChange} />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Google Meet Link</label>
                    <input type="url" className="form-control" name="meet_link" value={formData.meet_link} onChange={handleInputChange} />
                  </div>

                </div>

                <div className="modal-footer custom-modal-footer">
                  <button type="submit" className="btn btn-primary">{editingId ? "Update" : "Add"}</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================= TABLE ================= */}
      <table className="table table-bordered table-striped mt-3">
        <thead className="table-secondary">
          <tr>
            <th>S.No</th>
            <th>Coach</th>
            <th>Class Type</th> {/* NEW COLUMN */}
            <th>Class Name</th>
            <th>Status</th>
            <th>Time</th>
            <th>Level</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {classes.map((cls, idx) => (
            <tr key={cls.id}>
              <td>{idx + 1}</td>
              <td>{cls.coach}</td>
              <td>{cls.class_type || '-'}</td>
              <td>{cls.class_name}</td>
              <td>{cls.status}</td>
              <td>{cls.time}</td>
              <td>{cls.level}</td>
              <td>{cls.date}</td>
              <td>
                <div className="d-flex gap-2">
                  <button className="btn btn-warning btn-sm" onClick={() => handleEditClick(cls)}>Edit</button>
                  {cls.meet_link ? (
                    <button className="btn btn-secondary btn-sm" onClick={() => handleShareClick(cls)}>Share</button>
                  ) : (
                    <button className="btn btn-secondary btn-sm" disabled>No Link</button>
                  )}
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClick(cls.id)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ================= SHARE MODAL ================= */}
      {showShareModal && sharedClass && (
        <div className="modal fade show d-block custom-modal-overlay">
          <div className="modal-dialog">
            <div className="modal-content shadow custom-modal-content">
              <div className="modal-header custom-modal-header">
                <h5 className="modal-title">Class Details</h5>
                <button type="button" className="btn-close" onClick={() => setShowShareModal(false)} />
              </div>

              <div className="modal-body custom-modal-body">
                <p><strong>Coach:</strong> {sharedClass.coach}</p>
                <p><strong>Class Type:</strong> {sharedClass.class_type}</p>
                <p><strong>Class Name:</strong> {sharedClass.class_name}</p>
                <p><strong>Status:</strong> {sharedClass.status}</p>
                <p><strong>Time:</strong> {sharedClass.time}</p>
                <p><strong>Level:</strong> {sharedClass.level}</p>
                <p><strong>Date:</strong> {sharedClass.date}</p>

                <p>
                  <strong>Meet Link:</strong>{" "}
                  <a href={sharedClass.meet_link} target="_blank">
                    {sharedClass.meet_link}
                  </a>
                </p>
              </div>

              <div className="modal-footer custom-modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowShareModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-modal-overlay {
          background: rgba(0, 0, 0, 0.4);
          position: fixed;
          inset: 0;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .custom-modal-content { max-height: 80vh; }
        .custom-modal-body { max-height: 65vh; overflow-y: auto; }
      `}</style>
    </div>
  );
}

