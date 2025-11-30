'use client';

import React, { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { Container, Col, Row, Card } from "react-bootstrap";
import { useRouter } from "next/navigation";

import PaymentsChart from "../PaymentsChart/PaymentsChart";
import AssignmentChart from "../Assignment-chart/Assignment-chart";
import { StatRightTopIcon } from "widgets";
import { ActiveProjects, Teams, TasksPerformance } from "sub-components";
import ProjectsStatsData from "data/dashboard/ProjectsStatsData";
import { supabase } from "../../lib/supabaseClient";

const DashboardPage = () => {
  const router = useRouter();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function loadUser() {
      // redirect if not authenticated
      if (typeof window !== 'undefined' && !localStorage.getItem("isAuthenticated")) {
        router.replace("/Authentication/sign-in");
        return;
      }

      // get auth user
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) return;

      // fetch profile row (only email and branch_name)
      const { data: profileData } = await supabase
        .from("profiles")
        .select("branch_name, email")
        .eq("id", user.id)
        .maybeSingle();

      setProfile(profileData || { email: user.email || '', branch_name: '' });
    }

    loadUser();
  }, [router]);

  return (
    <Fragment>
      <div className="bg-primary pt-10 pb-21"></div>
      <Container fluid className="mt-n22 px-6">
        <Row>
          <Col lg={12} md={12} xs={12}>
            <div className="d-flex justify-content-between align-items-center">
              <div className="mb-2 mb-lg-0">
                <h3 className="mb-0 text-white">Student Dashboard</h3>
              </div>

              {/* REPLACED: Add Dashboard button -> Profile card */}
              <div style={{ minWidth: 220 }}>
                {profile ? (
                  <Card className="shadow-sm" style={{ borderRadius: 8 }}>
                    <Card.Body style={{ padding: '10px 14px' }}>
                      <div style={{ fontSize: 12, color: '#6f6f9a', fontWeight: 600, marginBottom: 6 }}>
                        Logged In Admin
                      </div>

                      <div style={{ fontSize: 14, color: '#222', fontWeight: 600, marginBottom: 4 }}>
                        {profile.branch_name || '—'}
                      </div>

                      <div style={{ fontSize: 13, color: '#6b6b85', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {profile.email || '—'}
                      </div>
                    </Card.Body>
                  </Card>
                ) : (
                  <div style={{ height: 56 }} /> // keep header spacing while loading
                )}
              </div>
            </div>
          </Col>

          {ProjectsStatsData.map((item, index) => (
            <Col key={index} xl={3} lg={6} md={12} xs={12} className="mt-6">
              <StatRightTopIcon info={item} />
            </Col>
          ))}
        </Row>

        <Row className="my-6">
          <Col xl={4} lg={12} md={12} xs={12} className="mb-6 mb-xl-0">
            <TasksPerformance />
          </Col>
          <Col xl={4} lg={12} md={12} xs={12} className="mb-6 mb-xl-0">
            <PaymentsChart />
          </Col>
          <Col xl={4} lg={12} md={12} xs={12}>
            <AssignmentChart />
          </Col>
        </Row>
      </Container>
    </Fragment>
  );
};

export default DashboardPage;
