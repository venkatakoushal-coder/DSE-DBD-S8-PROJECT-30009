import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { CourseCard } from '../components/CourseCard';

export const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const data = await api.courses.getAll();
        setCourses(data);
        setFilteredCourses(data);

        const uniqueCategories = Array.from(new Set(data.map((c) => c.category))).filter(Boolean);
        setCategories(uniqueCategories);
      } catch (err) {
        setError(err.message || 'Failed to load courses.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    let result = courses;

    if (selectedCategory !== 'all') {
      result = result.filter((c) => c.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.course_code.toLowerCase().includes(q) ||
          (c.teacher_name && c.teacher_name.toLowerCase().includes(q))
      );
    }

    setFilteredCourses(result);
  }, [selectedCategory, searchQuery, courses]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading course catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Course Catalog</h1>
          <p className="page-subtitle">
            Explore university-approved curricula, enroll in modules, and advance your skills
          </p>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="filter-bar card">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by title, course code, or professor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="category-chips">
          <button
            type="button"
            className={`chip ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Fields ({courses.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredCourses.length === 0 ? (
        <div className="empty-state card">
          <p>No courses match your filter criteria.</p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="btn btn-outline"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="courses-grid">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.course_id}
              course={course}
              actionLink={`/courses/${course.course_id}`}
              actionText="View Course"
            />
          ))}
        </div>
      )}
    </div>
  );
};
