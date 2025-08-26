// src/pages/Blog/BlogPost.js  
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import api from '../../api';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    try {
      const response = await api.get(`/blog/posts/${slug}`);
      setPost(response.data);
    } catch (error) {
      setError(error.response?.status === 404 ? 'Post not found' : 'Error loading post');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading post...</div>;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
        <p className="text-gray-600 mb-4">{error}</p>
        <Link to="/blog" className="text-blue-600 hover:text-blue-800">
          ← Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Navigation */}
      <Link to="/blog" className="text-blue-600 hover:text-blue-800 mb-6 inline-block">
        ← Back to Blog
      </Link>

      {/* Article Header */}
      <article>
        {post.featured_image && (
          <img 
            src={post.featured_image} 
            alt={post.title}
            className="w-full h-64 object-cover rounded-lg mb-6"
          />
        )}

        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          
          <div className="flex items-center text-gray-600 text-sm mb-4">
            <span>By {post.author_name}</span>
            <span className="mx-2">•</span>
            <span>{new Date(post.published_at).toLocaleDateString()}</span>
            <span className="mx-2">•</span>
            <span>{post.view_count} views</span>
            {post.category && (
              <>
                <span className="mx-2">•</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {post.category}
                </span>
              </>
            )}
          </div>

          {post.tags && post.tags.length > 0 && (
            <div className="flex gap-2 mb-6">
              {post.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </header>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>

        {/* Article Footer */}
        <footer className="mt-8 pt-8 border-t border-gray-200">
          <div className="text-center">
            <p className="text-gray-600">
              Want to explore AI conversations yourself?{' '}
              <Link to="/app" className="text-blue-600 hover:text-blue-800">
                Start chatting with historical figures →
              </Link>
            </p>
          </div>
        </footer>
      </article>
    </div>
  );
}