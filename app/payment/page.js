'use client';

import { useState, useEffect } from 'react';
import { Container, Row, Col, Table, Card, Badge, Button, Modal, Spinner } from 'react-bootstrap';
import { FaCreditCard, FaCheckCircle, FaTimesCircle, FaMoneyBillWave, FaUser } from 'react-icons/fa';
import { supabase } from '../../lib/supabaseClient';

const statusBadge = (status) => {
  switch (String(status || '').toLowerCase()) {
    case 'completed':
    case 'paid':
      return <Badge bg="success"><FaCheckCircle /> {status}</Badge>;
    case 'pending':
      return <Badge bg="warning" text="dark">{status}</Badge>;
    case 'failed':
      return <Badge bg="danger"><FaTimesCircle /> {status}</Badge>;
    default:
      return <Badge bg="secondary">{status || '—'}</Badge>;
  }
};

const PaymentDashboard = () => {
  const [students, setStudents] = useState([]); // each student has payments[] and latest_payment
  const [loading, setLoading] = useState(true);

  // student details modal
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentLoading, setStudentLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // due modal (shared for student or payment)
  const [showDueModal, setShowDueModal] = useState(false);
  const [dueLoading, setDueLoading] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [dueNote, setDueNote] = useState('');
  const [editingMode, setEditingMode] = useState(null); // 'student' or 'payment'
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editingPaymentId, setEditingPaymentId] = useState(null);

  useEffect(() => {
    const fetchStudentsWithLatestPayment = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('student_list')
          .select(`
            id,
            reg_no,
            name,
            dob,
            email,
            phone,
            place,
            class_type,
            group_name,
            course,
            level,
            avatar,
            payment,
            status,
            fees,
            due_date,
            due_note,
            payments:payments (
              id,
              student_id,
              method,
              amount,
              status,
              date,
              due_date,
              note,
              razorpay_order_id,
              razorpay_payment_id,
              raw_payload
            )
          `)
          .order('name', { ascending: true });

        if (error) {
          console.error('Error fetching students:', error);
          setStudents([]);
        } else {
          const normalized = (data || []).map((s) => {
            const payments = Array.isArray(s.payments) ? s.payments.slice() : [];
            payments.sort((a, b) => {
              const da = a?.date ? new Date(a.date).getTime() : 0;
              const db = b?.date ? new Date(b.date).getTime() : 0;
              if (db !== da) return db - da;
              return (b.id || 0) - (a.id || 0);
            });
            const latestPayment = payments.length ? payments[0] : null;
            if (latestPayment && latestPayment.amount != null) latestPayment.amount = Number(latestPayment.amount);
            return { ...s, payments, latest_payment: latestPayment };
          });
          setStudents(normalized);
        }
      } catch (err) {
        console.error('Unexpected error fetching students with payments:', err);
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentsWithLatestPayment();
  }, []);

  // sum of all paid/completed payments across students
  const totalCollected = students.reduce((sum, s) => {
    const payments = s.payments || [];
    const paidSum = payments
      .filter(p => {
        const st = String(p?.status || '').toLowerCase();
        return st === 'paid' || st === 'completed';
      })
      .reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    return sum + paidSum;
  }, 0);

  const handleShowDetails = async (student) => {
    if (!student || !student.id) {
      setSelectedStudent(null);
      setShowStudentModal(true);
      return;
    }

    setStudentLoading(true);
    setShowStudentModal(true);
    try {
      const { data: studentRow, error: studentErr } = await supabase
        .from('student_list')
        .select('id, reg_no, name, dob, email, phone, place, class_type, group_name, course, level, avatar, payment, status, fees, due_date, due_note')
        .eq('id', student.id)
        .single();

      if (studentErr) {
        console.error('Error fetching student details:', studentErr);
        setSelectedStudent(student);
      } else {
        setSelectedStudent(studentRow);
      }
    } catch (err) {
      console.error('Unexpected error fetching student details:', err);
      setSelectedStudent(student);
    } finally {
      setStudentLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowStudentModal(false);
    setSelectedStudent(null);
  };

  // Open due modal for student (unpaid case) or payment (paid case)
  const openDueModalForStudent = (student) => {
    setEditingMode('student');
    setEditingStudentId(student.id);
    setEditingPaymentId(null);
    setDueDate(student.due_date ? String(student.due_date).slice(0, 10) : '');
    setDueNote(student.due_note || '');
    setShowDueModal(true);
  };

  const openDueModalForPayment = (payment) => {
    setEditingMode('payment');
    setEditingPaymentId(payment.id);
    setEditingStudentId(null);
    setDueDate(payment.due_date ? String(payment.due_date).slice(0, 10) : '');
    setDueNote(payment.note || '');
    setShowDueModal(true);
  };

  const saveDue = async () => {
    setDueLoading(true);
    try {
      if (editingMode === 'student' && editingStudentId) {
        const { error } = await supabase
          .from('student_list')
          .update({
            due_date: dueDate || null,
            due_note: dueNote || null
          })
          .eq('id', editingStudentId);

        if (error) {
          console.error('Error saving student due:', error);
        } else {
          setStudents(prev =>
            prev.map(s => (s.id === editingStudentId ? { ...s, due_date: dueDate || null, due_note: dueNote || null } : s))
          );
          setShowDueModal(false);
          setEditingStudentId(null);
          setDueDate('');
          setDueNote('');
          setEditingMode(null);
        }
      } else if (editingMode === 'payment' && editingPaymentId) {
        const { error } = await supabase
          .from('payments')
          .update({
            due_date: dueDate || null,
            note: dueNote || null
          })
          .eq('id', editingPaymentId);

        if (error) {
          console.error('Error saving payment due:', error);
        } else {
          setStudents(prev =>
            prev.map(student => {
              const payments = (student.payments || []).map(p => (p.id === editingPaymentId ? { ...p, due_date: dueDate || null, note: dueNote || null } : p));
              // recalc latest_payment
              const sorted = payments.slice().sort((a, b) => {
                const da = a?.date ? new Date(a.date).getTime() : 0;
                const db = b?.date ? new Date(b.date).getTime() : 0;
                if (db !== da) return db - da;
                return (b.id || 0) - (a.id || 0);
              });
              return { ...student, payments, latest_payment: sorted.length ? sorted[0] : null };
            })
          );
          setShowDueModal(false);
          setEditingPaymentId(null);
          setDueDate('');
          setDueNote('');
          setEditingMode(null);
        }
      }
    } catch (err) {
      console.error('Unexpected error saving due:', err);
    } finally {
      setDueLoading(false);
    }
  };

  return (
    <Container fluid className="p-4">
      <h2 className="mb-4"><FaMoneyBillWave /> Payment Dashboard</h2>

      <Row className="mb-4 align-items-center">
        <Col md={3}>
          <Card className="text-white bg-primary mb-3 shadow-sm">
            <Card.Body>
              <Card.Title><FaUser /> Total Students</Card.Title>
              <Card.Text style={{ fontSize: '2rem' }}>{students.length}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-white bg-success mb-3 shadow-sm">
            <Card.Body>
              <Card.Title><FaCreditCard /> Total Collection</Card.Title>
              <Card.Text style={{ fontSize: '2rem' }}>₹ {totalCollected.toFixed(2)}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-white bg-warning mb-3 shadow-sm">
            <Card.Body>
              <Card.Title>Unpaid Students</Card.Title>
              <Card.Text style={{ fontSize: '2rem' }}>
                {students.filter(s => {
                  const payments = s.payments || [];
                  const hasPaid = payments.some(p => {
                    const st = String(p?.status || '').toLowerCase();
                    return st === 'paid' || st === 'completed';
                  });
                  return !hasPaid;
                }).length}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          {loading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 200 }}>
              <Spinner animation="border" />
            </div>
          ) : (
            <Table responsive bordered hover className="shadow-sm">
              <thead className="table-dark">
                <tr>
                  <th>S.no</th>
                  <th>Student</th>
                  <th>Payment Method</th>
                  <th>Amount (₹)</th>
                  <th>Payment Status</th>
                  <th>Payment Date</th>
                  <th>Due Date (Deadline)</th>
                  <th>Note</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => {
                  const latest = student.latest_payment;
                  const paymentMethod = latest?.method || '—';
                  const paymentAmount = latest?.amount != null ? Number(latest.amount).toFixed(2) : '—';
                  const paymentStatus = latest?.status || (student.payment ? student.payment : 'Not paid');
                  const paymentDate = latest?.date || '—';

                  // show due: prefer payment.due_date if exists, otherwise student.due_date
                  const dueDateToShow = latest?.due_date ? String(latest.due_date).slice(0, 10) : (student.due_date ? String(student.due_date).slice(0, 10) : '—');
                  const noteToShow = latest?.note || student.due_note || '—';

                  return (
                    <tr key={student.id}>
                      <td>{idx + 1}</td>
                      <td>{student.name}</td>
                      <td>{paymentMethod}</td>
                      <td>{paymentAmount}</td>
                      <td>{latest ? statusBadge(paymentStatus) : <Badge bg="warning">Not paid</Badge>}</td>
                      <td>{paymentDate}</td>
                      <td>{dueDateToShow}</td>
                      <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{noteToShow}</td>
                      <td>
                        <Button variant="outline-primary" size="sm" onClick={() => handleShowDetails(student)}>Details</Button>{' '}
                        {!latest /* no payment -> unpaid */ ? (
                          <Button variant="outline-secondary" size="sm" className="ms-2" onClick={() => openDueModalForStudent(student)}>
                            Add Due
                          </Button>
                        ) : ((String(latest.status || '').toLowerCase() === 'paid' || String(latest.status || '').toLowerCase() === 'completed') ? (
                          <Button variant="outline-secondary" size="sm" className="ms-2" onClick={() => openDueModalForPayment(latest)}>
                            {latest.due_date || latest.note ? 'Edit Due' : 'Edit Due'}
                          </Button>
                        ) : (
                          // student has a payment but not completed — allow setting student-level due too
                          <Button variant="outline-secondary" size="sm" className="ms-2" onClick={() => openDueModalForStudent(student)}>
                            Add Due
                          </Button>
                        ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          )}
        </Col>
      </Row>

      {/* Student Details Modal */}
      <Modal show={showStudentModal} onHide={handleCloseModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Student Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {studentLoading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 120 }}>
              <Spinner animation="border" />
            </div>
          ) : selectedStudent ? (
            <div>
              <Row>
                <Col md={4} className="text-center">
                  {selectedStudent.avatar ? (
                    <img src={selectedStudent.avatar} alt="avatar" style={{ width: 120, height: 120, borderRadius: 8, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 120, height: 120, borderRadius: 8, background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FaUser size={40} color="#666" />
                    </div>
                  )}
                </Col>
                <Col md={8}>
                  <h4>{selectedStudent.name}</h4>
                  <p><strong>Reg No:</strong> {selectedStudent.reg_no}</p>
                  <p><strong>Course:</strong> {selectedStudent.course || '—'}</p>
                  <p><strong>Class Type:</strong> {selectedStudent.class_type || '—'}</p>
                  <p><strong>Group:</strong> {selectedStudent.group_name || '—'}</p>
                </Col>
              </Row>

              <hr />

              <Row>
                <Col md={6}>
                  <p><strong>Email:</strong> {selectedStudent.email || '—'}</p>
                  <p><strong>Phone:</strong> {selectedStudent.phone || '—'}</p>
                  <p><strong>Place:</strong> {selectedStudent.place || '—'}</p>
                </Col>
                <Col md={6}>
                  <p><strong>DOB:</strong> {selectedStudent.dob || '—'}</p>
                  <p><strong>Fees:</strong> {selectedStudent.fees != null ? `₹ ${Number(selectedStudent.fees).toFixed(2)}` : '—'}</p>
                  <p><strong>Status:</strong> {selectedStudent.status || '—'}</p>
                  <p><strong>Due Deadline:</strong> {selectedStudent.due_date ? String(selectedStudent.due_date).slice(0,10) : '—'}</p>
                  <p><strong>Due Note:</strong> {selectedStudent.due_note || '—'}</p>
                </Col>
              </Row>
            </div>
          ) : (
            <div className="text-center">
              <p>No student details found.</p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>Close</Button>
        </Modal.Footer>
      </Modal>

      {/* Add / Edit Due Modal */}
      <Modal show={showDueModal} onHide={() => setShowDueModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingMode === 'payment' ? 'Edit Due (Payment)' : 'Set Due Deadline (Student)'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label className="form-label">Due Date (Deadline)</label>
            <input
              type="date"
              className="form-control"
              value={dueDate || ''}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Note</label>
            <textarea
              className="form-control"
              rows={3}
              value={dueNote || ''}
              onChange={(e) => setDueNote(e.target.value)}
              placeholder="e.g., pay before this date, contact admin for installments"
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDueModal(false)} disabled={dueLoading}>Cancel</Button>
          <Button variant="primary" onClick={saveDue} disabled={dueLoading}>
            {dueLoading ? <Spinner animation="border" size="sm" /> : 'Save'}
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        h2 {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .badge {
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 0.4em 0.7em;
          border-radius: 8px;
        }
      `}</style>
    </Container>
  );
};

export default PaymentDashboard;
