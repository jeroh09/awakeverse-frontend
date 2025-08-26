// src/pages/Blog/BlogList.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';

export default function BlogList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, [currentPage]);

  const fetchPosts = async () => {
    try {
      const response = await api.get(`/blog/posts?page=${currentPage}`);
      setPosts(response.data.posts);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/blog/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading blog posts...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Awakeverse Blog</h1>
        <p className="text-gray-600">Insights on AI, history, and the future of conversation</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="lg:w-2/3">
          {posts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No blog posts yet. Check back soon!</p>
            </div>
          ) : (
            <>
              {/* Blog Posts */}
              <div className="space-y-8">
                {posts.map((post) => (
                  <article key={post.id} className="border-b border-gray-200 pb-8">
                    {post.featured_image && (
                      <img 
                        src={post.featured_image} 
                        alt={post.title}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    )}
                    
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <span>By {post.author_name}</span>
                      <span className="mx-2">•</span>
                      <span>{new Date(post.published_at).toLocaleDateString()}</span>
                      {post.category && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {post.category}
                          </span>
                        </>
                      )}
                    </div>

                    <h2 className="text-2xl font-bold mb-3">
                      <Link 
                        to={`/blog/${post.slug}`}
                        className="text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {post.title}
                      </Link>
                    </h2>

                    <p className="text-gray-600 mb-4">{post.excerpt}</p>

                    <div className="flex items-center justify-between">
                      <Link 
                        to={`/blog/${post.slug}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Read more →
                      </Link>
                      
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex gap-2">
                          {post.tags.slice(0, 3).map((tag, index) => (
                            <span 
                              key={index}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center mt-8">
                  <div className="flex gap-2">
                    {currentPage > 1 && (
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        className="px-4 py-2 border rounded hover:bg-gray-50"
                      >
                        Previous
                      </button>
                    )}
                    
                    <span className="px-4 py-2 bg-blue-600 text-white rounded">
                      Page {currentPage} of {pagination.pages}
                    </span>
                    
                    {currentPage < pagination.pages && (
                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className="px-4 py-2 border rounded hover:bg-gray-50"
                      >
                        Next
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:w-1/3">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Categories</h3>
            {categories.length > 0 ? (
              <ul className="space-y-2">
                {categories.map((category) => (
                  <li key={category.name}>
                    <Link 
                      to={`/blog?category=${category.name}`}
                      className="flex justify-between text-gray-600 hover:text-blue-600"
                    >
                      <span>{category.name}</span>
                      <span className="text-sm">({category.count})</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No categories yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}