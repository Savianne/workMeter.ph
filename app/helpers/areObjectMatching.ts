function areObjectsMatching(obj1: Record<string, any>, obj2: Record<string, any>): boolean {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    // Check if the number of keys is the same
    if (keys1.length !== keys2.length) {
        return false;
    }

    // Check if all keys and values match
    for (const key of keys1) {
        const val1 = typeof obj1[key] == 'string'? obj1[key].trim() : obj1[key];
        const val2 = typeof obj2[key] == 'string'? obj2[key].trim() : obj2[key];
        if (val1 !== val2) {
            return false;
        }
    }

    return true;
  }
  
  export default areObjectsMatching;