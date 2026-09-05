// TestComponent.jsx - Temporary debug component
import React from 'react';
import { useFeaturedCharacters } from '../hooks/useFeaturedCharacters';
import FeaturedCarousel from './FeaturedCarousel';

const TestFeatured = () => {
  const { featuredCharacters, loading, error } = useFeaturedCharacters();
  
  console.log('🔍 TestFeatured - Hook data:', {
    featuredCharacters,
    loading,
    error
  });

  if (loading) return <div>Loading featured characters...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h3>Featured Characters Test</h3>
      <p>Count: {featuredCharacters.length}</p>
      
      <FeaturedCarousel 
        characters={featuredCharacters}
        loading={loading}
      />
    </div>
  );
};