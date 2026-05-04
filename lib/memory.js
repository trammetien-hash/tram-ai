let memory = [];

export function addMemory(text) {
  memory.push(text);

  if (memory.length > 10) {
    memory = memory.slice(-10);
  }
}

export function getMemory() {
  return memory;
}
