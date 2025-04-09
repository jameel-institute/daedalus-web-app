// Object.freeze is shallow, only freezing the top level of an object.
export const deepFreeze = (data: any): any => {
  if (Array.isArray(data)) {
    return Object.freeze(data.map(d => deepFreeze(d)));
  }
  if (data != null && typeof data === "object") {
    for (const prop in data) {
      if (Object.prototype.hasOwnProperty.call(data, prop)) {
        data[prop] = deepFreeze(data[prop]);
      }
    }
    return Object.freeze(data);
  }
  return data;
};
