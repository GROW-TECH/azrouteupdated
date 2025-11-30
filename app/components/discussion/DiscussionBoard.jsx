// components/discussion/DiscussionBoard.jsx
"use client"
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { NewThreadDialog } from "./NewThreadDialog";
import { ThreadList } from "./ThreadList";
import { SearchFilters } from "./SearchFilters";
import { MessageSquare, TrendingUp, Users, Star } from "lucide-react";

export function DiscussionBoard({ courseId, userType }) {
  const [view, setView] = useState('recent');
  const [searchQuery, setSearchQuery] = useState('');

  const stats = {
    totalThreads: 125,
    activeDiscussions: 15,
    totalResponses: 450,
    participation: '85%'
  };

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Threads</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalThreads}</div>
            <p className="text-xs text-muted-foreground">
              Across all topics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Discussions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeDiscussions}</div>
            <p className="text-xs text-muted-foreground">
              In the last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResponses}</div>
            <p className="text-xs text-muted-foreground">
              Student engagement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participation Rate</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.participation}</div>
            <p className="text-xs text-muted-foreground">
              Active participants
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search discussions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <NewThreadDialog userType={userType} />
        </div>

        <div className="flex gap-8">
          <div className="w-64">
            <SearchFilters />
          </div>

          <div className="flex-1">
            <Tabs value={view} onValueChange={setView} className="w-full">
              <TabsList>
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="popular">Popular</TabsTrigger>
                <TabsTrigger value="unanswered">Unanswered</TabsTrigger>
                {userType === 'teacher' && (
                  <TabsTrigger value="flagged">Flagged</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="recent">
                <ThreadList 
                  view="recent" 
                  userType={userType}
                  searchQuery={searchQuery}
                />
              </TabsContent>
              <TabsContent value="popular">
                <ThreadList 
                  view="popular" 
                  userType={userType}
                  searchQuery={searchQuery}
                />
              </TabsContent>
              <TabsContent value="unanswered">
                <ThreadList 
                  view="unanswered" 
                  userType={userType}
                  searchQuery={searchQuery}
                />
              </TabsContent>
              {userType === 'teacher' && (
                <TabsContent value="flagged">
                  <ThreadList 
                    view="flagged" 
                    userType={userType}
                    searchQuery={searchQuery}
                  />
                </TabsContent>
              )}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}