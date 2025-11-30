'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Container, Row, Col, Card, Form, Table } from 'react-bootstrap';

export default function CourseStudentsPage() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [filteredStudents, setFilteredStudents] = useState([]);

  useEffect(() => {
    async function fetchStudents() {
      const { data, error } = await supabase.from('student_list').select('*');
      if (!error) {
        setStudents(data);

        const courseNames = Array.from(new Set(data.map(s => s.course).filter(Boolean)));
        setCourses(['all', ...courseNames]);
      }
    }
    fetchStudents();
  }, []);

  useEffect(() => {
    if (selectedCourse && selectedCourse !== 'all') {
      setFilteredStudents(students.filter(s => s.course === selectedCourse));
    } else {
      setFilteredStudents(students);
    }
  }, [selectedCourse, students]);

  const totalStudents = filteredStudents.length;
  const registered = filteredStudents.length;

  const unregistered = students.filter(student => !student.course).length;

  return (
    <Container>
      <h2 className="my-4">Course Registered Student List</h2>
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center">
            <Card.Body>
              <Card.Title>Total Students</Card.Title>
              <Card.Text>{totalStudents}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center bg-success text-white">
            <Card.Body>
              <Card.Title>Registered</Card.Title>
              <Card.Text>{registered}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        {selectedCourse === 'all' && (
          <Col md={4}>
            <Card className="text-center bg-danger text-white">
              <Card.Body>
                <Card.Title>Unregistered</Card.Title>
                <Card.Text>{unregistered}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Select Course</Form.Label>
        <Form.Select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)}>
          {courses.map(course => (
            <option key={course} value={course}>
              {course === 'all' ? 'All' : course}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <Table striped bordered hover className="mt-4">
        <thead>
          <tr>
            <th>S.No</th>
            <th>RegNo</th>
            <th>Student Name</th>
            <th>Course</th>
            <th>Level</th>
          </tr>
        </thead>
        <tbody>
          {filteredStudents.map((student, i) => (
            <tr key={student.id}>
              <td>{i + 1}</td>
              <td>{student.reg_no}</td>
              <td>{student.name}</td>
              <td>{student.course}</td>
              <td>{student.level}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}
