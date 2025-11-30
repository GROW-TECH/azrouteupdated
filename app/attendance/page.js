'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Card, Form, Button, Modal } from 'react-bootstrap';
import { FaUserCheck, FaUserTimes, FaUsers, FaCalendarAlt, FaEye } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';

const AttendanceClassSummary = () => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterParams, setFilterParams] = useState({ searchTerm: '', from: '', to: '' });
  const [records, setRecords] = useState([]);
  const [studentsMap, setStudentsMap] = useState({});
  const [studentSummaries, setStudentSummaries] = useState([]);
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalStudentId, setModalStudentId] = useState(null);
  const [modalStudentRecords, setModalStudentRecords] = useState([]);

  useEffect(() => {
    async function fetchTotalStudents() {
      try {
        const { count, error } = await supabase
          .from('student_list')
          .select('id', { count: 'exact', head: true });
        if (error) throw error;
        setTotalStudentsCount(count || 0);
      } catch (e) {
        setTotalStudentsCount(0);
      }
    }
    fetchTotalStudents();
  }, []);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // include attendance_mode
        let query = supabase
          .from('attendance')
          .select('student_id, attendance_date, status, class_type, attendance_mode');
        if (filterParams.from) query = query.gte('attendance_date', filterParams.from);
        if (filterParams.to) query = query.lte('attendance_date', filterParams.to);

        const { data, error } = await query;
        if (error) throw error;

        let filtered = data || [];
        if (filterParams.searchTerm) {
          filtered = filtered.filter(
            r => r.class_type && r.class_type.toLowerCase().includes(filterParams.searchTerm.toLowerCase())
          );
        }
        setRecords(filtered);
      } catch (e) {
        setError(e.message ?? String(e));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [filterParams]);

  // Fetch student names for records
  useEffect(() => {
    async function fetchStudents() {
      if (!records || records.length === 0) {
        setStudentsMap({});
        return;
      }
      const ids = Array.from(new Set(records.map(r => r.student_id))).filter(Boolean);
      if (ids.length === 0) {
        setStudentsMap({});
        return;
      }
      try {
        const { data: students, error } = await supabase
          .from('student_list')
          .select('id, name')
          .in('id', ids);
        if (error) throw error;
        const map = {};
        students.forEach(s => {
          map[s.id] = s.name ?? `Student ${s.id}`;
        });
        setStudentsMap(map);
      } catch (e) {
        const map = {};
        ids.forEach(id => (map[id] = `Student ${id}`));
        setStudentsMap(map);
      }
    }
    fetchStudents();
  }, [records]);

  // Build per-student summary whenever records or studentsMap change
  useEffect(() => {
    const summaries = [];
    const studentIds = Array.from(new Set(records.map(r => r.student_id))).filter(Boolean);
    studentIds.forEach(id => {
      const recs = records.filter(r => r.student_id === id);

      // overall present/absent
      const present = recs.filter(r => r.status === 'P').length;
      const absent = recs.filter(r => r.status === 'A').length;
      const total = present + absent;
      const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : '0.0';

      // split by mode
      const individualPresent = recs.filter(r => r.status === 'P' && (r.attendance_mode === 'individual' || !r.attendance_mode)).length;
      const individualAbsent = recs.filter(r => r.status === 'A' && (r.attendance_mode === 'individual' || !r.attendance_mode)).length;
      const groupPresent = recs.filter(r => r.status === 'P' && r.attendance_mode === 'group').length;
      const groupAbsent = recs.filter(r => r.status === 'A' && r.attendance_mode === 'group').length;

      // unique modes label as before
      const modes = Array.from(new Set(recs.map(r => r.attendance_mode).filter(Boolean)));
      const modesLabel = modes.length ? modes.join(', ') : 'individual';

      summaries.push({
        student_id: id,
        name: studentsMap[id] ?? `Student ${id}`,
        total,
        present,
        absent,
        percentage,
        modes: modesLabel,
        individualPresent,
        individualAbsent,
        groupPresent,
        groupAbsent
      });
    });
    summaries.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    setStudentSummaries(summaries);
  }, [records, studentsMap]);

  // Overall totals for dashboard cards
  const totalPresent = records.filter(r => r.status === 'P').length;
  const totalAbsent = records.filter(r => r.status === 'A').length;

  // Open modal and set selected student's records (uses already-fetched records)
  const openStudentModal = (studentId) => {
    setModalStudentId(studentId);
    const sRecords = records
      .filter(r => r.student_id === studentId)
      .sort((a,b) => new Date(a.attendance_date) - new Date(b.attendance_date));
    setModalStudentRecords(sRecords);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalStudentId(null);
    setModalStudentRecords([]);
  };

  return (
    <Container fluid className="p-4">
      <h2 className="mb-4"><FaCalendarAlt /> Attendance Management</h2>
      {error && <p className="text-danger">{error}</p>}
      {loading && <p>Loading...</p>}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="shadow" style={{ background: '#6C63FF', color: '#fff' }}>
            <Card.Body>
              <Card.Title><FaUsers /> Total Students</Card.Title>
              <Card.Text style={{ fontSize: 32, fontWeight: 700 }}>{totalStudentsCount}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow" style={{ background: '#27ae60', color: '#fff' }}>
            <Card.Body>
              <Card.Title><FaUserCheck />Total Present Counts</Card.Title>
              <Card.Text style={{ fontSize: 32, fontWeight: 700 }}>{totalPresent}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow" style={{ background: '#e74c3c', color: '#fff' }}>
            <Card.Body>
              <Card.Title><FaUserTimes />Total Absent Counts</Card.Title>
              <Card.Text style={{ fontSize: 32, fontWeight: 700 }}>{totalAbsent}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-3" style={{ gap: 10 }}>
        <Col md={3}>
          <Form.Control type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} max={toDate} />
        </Col>
        <Col md={3}>
          <Form.Control type="date" value={toDate} onChange={e => setToDate(e.target.value)} min={fromDate} />
        </Col>
        <Col md={3}>
          <Form.Control type="text" placeholder="Search class" value={search} onChange={e => setSearch(e.target.value)} />
        </Col>
        <Col md={1}>
          <Button
            variant="primary"
            onClick={() => setFilterParams({ searchTerm: search, from: fromDate, to: toDate })}
            style={{ width: '100%' }}
          >
            Search
          </Button>
        </Col>
        <Col md={2}>
          <Button
            variant="success"
            onClick={() => router.push('/attendance/add')}
            style={{ width: '100%' }}
          >
            + Add Attendance
          </Button>
        </Col>
      </Row>

      <Table bordered hover responsive className="shadow-sm text-center align-middle">
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>Student</th>
            <th>Mode</th>
            <th>Total Records</th>
            <th>Individual Present</th>
            <th>Group Present</th>
            <th><FaUserCheck /> Present</th>
            <th><FaUserTimes /> Absent</th>
            <th>Attendance %</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {studentSummaries.length === 0 && !loading && (
            <tr><td colSpan={10} className="text-center">No students found.</td></tr>
          )}
          {studentSummaries.map((s, idx) => (
            <tr key={s.student_id}>
              <td>{idx + 1}</td>
              <td className="text-start">{s.name}</td>
              <td>{s.modes}</td>
              <td>{s.total}</td>
              <td className="fw-bold text-success">{s.individualPresent}</td>
              <td className="fw-bold text-success">{s.groupPresent}</td>
              <td className="fw-bold text-success">{s.present}</td>
              <td className="fw-bold text-danger">{s.absent}</td>
              <td className="fw-bold">{s.percentage}%</td>
              <td>
                <Button
                  size="sm"
                  variant="info"
                  onClick={() => openStudentModal(s.student_id)}
                >
                  <FaEye /> View
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Modal: student details */}
      <Modal show={showModal} onHide={closeModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalStudentId ? (studentsMap[modalStudentId] ?? `Student ${modalStudentId}`) : 'Student'} — Attendance Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {modalStudentRecords.length === 0 ? (
            <p className="text-center">No attendance records for this student in the selected range.</p>
          ) : (
            <Table bordered hover responsive className="text-center align-middle">
              <thead className="table-light">
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Class</th>
                  <th>Mode</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {modalStudentRecords.map((r, i) => (
                  <tr key={`${r.attendance_date}-${i}`}>
                    <td>{i + 1}</td>
                    <td>{new Date(r.attendance_date).toLocaleDateString()}</td>
                    <td className="text-start">{r.class_type}</td>
                    <td>{r.attendance_mode ?? 'individual'}</td>
                    <td className={r.status === 'P' ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                      {r.status === 'P' ? 'Present' : 'Absent'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>Close</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AttendanceClassSummary;
