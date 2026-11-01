// src/utils/characterExtractor.js
// Client-side character metadata extraction

// Era/Period Keywords Database
const ERA_KEYWORDS = {
  'Ancient': ['ancient', 'egypt', 'rome', 'greece', 'pharaoh', 'gladiator', 'bc', 'bce', 'roman', 'greek'],
  'Medieval': ['medieval', 'knight', 'castle', 'feudal', 'crusade', 'middle ages', 'kingdom', 'viking', 'castle'],
  'Renaissance': ['renaissance', 'da vinci', 'shakespeare', 'michelangelo', '16th century', 'elizabethan'],
  'Victorian': ['victorian', '19th century', 'industrial', 'sherlock', 'dickens', '1800s'],
  'Modern': ['modern', '20th century', 'world war', 'contemporary', 'present day', '1900s'],
  'Future': ['future', 'cyberpunk', 'space', 'ai', 'robot', 'dystopian', 'sci-fi', 'futuristic'],
  'Fantasy': ['fantasy', 'magic', 'dragon', 'elf', 'wizard', 'medieval-like', 'mythical'],
  'Mythological': ['myth', 'god', 'goddess', 'titan', 'olympian', 'norse', 'legend', 'deity']
};

// Personality Traits Dictionary
const PERSONALITY_TRAITS = {
  'Analytical': ['logic', 'analyze', 'reason', 'deduction', 'scientific', 'methodical', 'calculating'],
  'Creative': ['creative', 'imaginative', 'artistic', 'innovative', 'visionary', 'inventive'],
  'Brave': ['brave', 'courageous', 'fearless', 'bold', 'heroic', 'daring', 'valiant'],
  'Wise': ['wise', 'knowledgeable', 'sage', 'insightful', 'philosophical', 'learned'],
  'Charismatic': ['charismatic', 'charming', 'persuasive', 'eloquent', 'influential', 'magnetic'],
  'Mysterious': ['mysterious', 'enigmatic', 'secretive', 'cryptic', 'shadowy', 'arcane'],
  'Ruthless': ['ruthless', 'ambitious', 'calculating', 'strategic', 'determined', 'merciless'],
  'Compassionate': ['compassionate', 'kind', 'empathetic', 'caring', 'selfless', 'benevolent'],
  'Humorous': ['humorous', 'witty', 'funny', 'sarcastic', 'playful', 'jovial'],
  'Leader': ['leader', 'commanding', 'authoritative', 'inspiring', 'strategic', 'decisive'],
  'Rebellious': ['rebellious', 'revolutionary', 'defiant', 'unconventional', 'radical']
};

// Character Type Keywords
const CHARACTER_TYPES = {
  'Detective': ['detective', 'sleuth', 'investigator', 'sherlock'],
  'Ruler': ['king', 'queen', 'emperor', 'empress', 'pharaoh', 'sultan', 'monarch', 'ruler'],
  'Warrior': ['warrior', 'soldier', 'general', 'commander', 'knight', 'samurai', 'fighter'],
  'Scholar': ['scholar', 'philosopher', 'scientist', 'inventor', 'thinker', 'academic', 'professor'],
  'Artist': ['artist', 'painter', 'musician', 'writer', 'poet', 'sculptor', 'composer'],
  'Explorer': ['explorer', 'navigator', 'discoverer', 'adventurer', 'pioneer'],
  'Mystic': ['mystic', 'prophet', 'shaman', 'oracle', 'seer', 'witch', 'wizard', 'magician']
};

/**
 * Extract era from description
 */
export function extractEra(description) {
  if (!description) return 'Unknown Era';
  
  const lowerDesc = description.toLowerCase();
  let eraScores = {};
  
  // Score each era based on keyword matches
  Object.entries(ERA_KEYWORDS).forEach(([era, keywords]) => {
    const matches = keywords.filter(keyword => 
      lowerDesc.includes(keyword.toLowerCase())
    ).length;
    
    if (matches > 0) {
      eraScores[era] = matches;
    }
  });
  
  // Return era with highest score
  const highestScore = Math.max(...Object.values(eraScores));
  if (highestScore > 0) {
    const topEra = Object.keys(eraScores).find(key => eraScores[key] === highestScore);
    return topEra;
  }
  
  // Fallback: Try to extract century from text
  const centuryMatch = lowerDesc.match(/(\d+)(?:st|nd|rd|th)? century/);
  if (centuryMatch) {
    const century = parseInt(centuryMatch[1]);
    if (century < 5) return 'Ancient';
    if (century < 15) return 'Medieval';
    if (century < 18) return 'Renaissance';
    if (century < 20) return 'Victorian';
    return 'Modern';
  }
  
  // Check for year mentions
  const yearMatch = lowerDesc.match(/\b(1[0-9]{3}|2[0-9]{3})\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    if (year < 500) return 'Ancient';
    if (year < 1500) return 'Medieval';
    if (year < 1800) return 'Renaissance';
    if (year < 1900) return 'Victorian';
    return 'Modern';
  }
  
  return 'Timeless';
}

/**
 * Extract personality traits (top 3)
 */
export function extractPersonalityTraits(description) {
  if (!description) return [];
  
  const lowerDesc = description.toLowerCase();
  let traitScores = {};
  
  // Score each trait
  Object.entries(PERSONALITY_TRAITS).forEach(([trait, keywords]) => {
    const matches = keywords.filter(keyword => 
      lowerDesc.includes(keyword.toLowerCase())
    ).length;
    
    if (matches > 0) {
      traitScores[trait] = matches;
    }
  });
  
  // Also check for direct trait mentions
  Object.keys(PERSONALITY_TRAITS).forEach(trait => {
    if (lowerDesc.includes(trait.toLowerCase())) {
      traitScores[trait] = (traitScores[trait] || 0) + 2;
    }
  });
  
  // Return top 3 traits by score
  return Object.entries(traitScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([trait]) => trait);
}

/**
 * Extract character type
 */
export function extractCharacterType(description) {
  if (!description) return 'Historical Figure';
  
  const lowerDesc = description.toLowerCase();
  let typeScores = {};
  
  // Score each character type
  Object.entries(CHARACTER_TYPES).forEach(([type, keywords]) => {
    const matches = keywords.filter(keyword => 
      lowerDesc.includes(keyword.toLowerCase())
    ).length;
    
    if (matches > 0) {
      typeScores[type] = matches;
    }
  });
  
  // Return type with highest score
  const highestScore = Math.max(...Object.values(typeScores));
  if (highestScore > 0) {
    const topType = Object.keys(typeScores).find(key => typeScores[key] === highestScore);
    return topType;
  }
  
  return 'Historical Figure';
}

/**
 * Extract location mentions
 */
export function extractLocations(description) {
  if (!description) return [];
  
  // Common location patterns
  const patterns = [
    /(?:in|from|of|at) (?:the )?([A-Z][a-z]+(?: [A-Z][a-z]+)*)/g,
    /(?:born|lived|died|based) in ([A-Z][a-z]+(?: [A-Z][a-z]+)*)/gi,
    /(?:in )?([A-Z][a-z]+(?: [A-Z][a-z]+)*), ([A-Z][a-z]+)/gi
  ];
  
  const locations = new Set();
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(description)) !== null) {
      const location = match[1];
      // Filter out common non-location words
      const commonWords = ['He', 'She', 'They', 'His', 'Her', 'Their', 'The', 'This', 'That', 'Who'];
      if (!commonWords.includes(location) && location.length > 2) {
        locations.add(location);
      }
    }
  });
  
  return Array.from(locations).slice(0, 3); // Limit to 3
}

/**
 * Complete extraction function
 */
export function extractCharacterMetadata(characterData) {
  const { name, description = '', short_description = '', ...rest } = characterData;
  
  const fullDescription = [description, short_description].filter(Boolean).join(' ');
  
  const extractedEra = extractEra(fullDescription);
  const extractedTraits = extractPersonalityTraits(fullDescription);
  const extractedType = extractCharacterType(fullDescription);
  const extractedLocations = extractLocations(fullDescription);
  
  return {
    ...rest,
    extractedEra,
    extractedTraits,
    extractedType,
    extractedLocations,
    // Confidence score (0-100)
    extractionConfidence: Math.min(100, 
      (extractedTraits.length * 20) + 
      (extractedEra !== 'Unknown Era' && extractedEra !== 'Timeless' ? 30 : 0) +
      (extractedLocations.length * 10) +
      (extractedType !== 'Historical Figure' ? 20 : 0)
    ),
    hasExtractedMetadata: true
  };
}

/**
 * Hook to use extraction in components
 */
export function useCharacterMetadata(characterData) {
  const [metadata, setMetadata] = React.useState(null);
  
  React.useEffect(() => {
    if (characterData) {
      const extracted = extractCharacterMetadata(characterData);
      setMetadata(extracted);
    }
  }, [characterData]);
  
  return metadata;
}