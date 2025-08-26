// src/pages/Blog/BlogAdmin.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api';

export default function BlogAdmin() {
  const { token } = useAuth();
  const [posts, setPosts] = useState([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category: '',
    tags: [],
    status: 'draft',
    featured_image: ''
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/blog/admin/posts');
      setPosts(response.data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...formData,
        tags: Array.isArray(formData.tags) ? formData.tags : formData.tags.split(',').map(tag => tag.trim())
      };

      if (editingPost) {
        await api.put(`/blog/admin/posts/${editingPost.id}`, payload);
      } else {
        await api.post('/blog/admin/posts', payload);
      }

      // Reset form and refresh posts
      setFormData({
        title: '',
        content: '',
        excerpt: '',
        category: '',
        tags: [],
        status: 'draft',
        featured_image: ''
      });
      setShowEditor(false);
      setEditingPost(null);
      fetchPosts();
      
    } catch (error) {
      console.error('Error saving post:', error);
      alert('Error saving post. Please try again.');
    }
  };

  const handleEdit = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || '',
      category: post.category || '',
      tags: post.tags || [],
      status: post.status,
      featured_image: post.featured_image || ''
    });
    setShowEditor(true);
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await api.delete(`/blog/admin/posts/${postId}`);
      fetchPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const cancelEdit = () => {
    setShowEditor(false);
    setEditingPost(null);
    setFormData({
      title: '',
      content: '',
      excerpt: '',
      category: '',
      tags: [],
      status: 'draft',
      featured_image: ''
    });
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading admin panel...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Blog Admin</h1>
        <button
          onClick={() => setShowEditor(!showEditor)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showEditor ? 'Cancel' : 'New Post'}
        </button>
      </div>

      {/* Post Editor */}
      {showEditor && (
        <div className="bg-white border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingPost ? 'Edit Post' : 'Create New Post'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Content (Markdown supported)</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                rows="12"
                className="w-full border rounded px-3 py-2"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Excerpt</label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                  rows="3"
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tags (comma separated)</label>
                <input
                  type="text"
                  value={Array.isArray(formData.tags) ? formData.tags.join(', ') : formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  placeholder="ai, history, technology"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Featured Image URL</label>
              <input
                type="url"
                value={formData.featured_image}
                onChange={(e) => setFormData({...formData, featured_image: e.target.value})}
                className="w-full border rounded px-3 py-2"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              >
                {editingPost ? 'Update Post' : 'Create Post'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Posts List */}
      <div className="bg-white border rounded-lg">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">All Posts</h2>
        </div>
        
        {posts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No posts yet. Create your first post!
          </div>
        ) : (
          <div className="divide-y">
            {posts.map((post) => (
              <div key={post.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{post.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{post.excerpt}</p>
                    <div className="flex items-center text-xs text-gray-500 mt-2 space-x-4">
                      <span>Status: <span className={`font-medium ${
                        post.status === 'published' ? 'text-green-600' : 
                        post.status === 'draft' ? 'text-yellow-600' : 'text-gray-600'
                      }`}>{post.status}</span></span>
                      <span>{post.view_count || 0} views</span>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      {post.category && <span>Category: {post.category}</span>}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(post)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}