export const getGroqApiKey = () => {
  const keys = [];
  
  // Dynamically collect any environment variable that starts with GROQ_API_KEY
  // This smoothly covers GROQ_API_KEY, GROQ_API_KEY1, GROQ_API_KEY_2, etc.
  for (const [envKey, envValue] of Object.entries(process.env)) {
    if (envKey.startsWith("GROQ_API_KEY") && envValue && envValue.trim() !== "") {
      keys.push(envValue.trim());
    }
  }

  if (keys.length === 0) {
    console.error("❌ No GROQ_API_KEY found in environment variables!");
    return null;
  }

  // Randomly select a key to distribute the API load
  const randomIndex = Math.floor(Math.random() * keys.length);
  const selectedKey = keys[randomIndex];
  
  // Note: Avoid logging the actual key in production, just log the masked version for debug if needed
  // console.log(`[API Pool] Using key ending in ...${selectedKey.slice(-4)} (Pool size: ${keys.length})`);
  
  return selectedKey;
};
