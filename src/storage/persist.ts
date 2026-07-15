// CCA: 4
export async function requestPersistentStorage(): Promise<void> {
  if (!navigator.storage?.persist) {
    console.info('Persistent storage API not available');
    return;
  }
  try {
    const granted = await navigator.storage.persist();
    console.info(granted ? 'Persistent storage granted' : 'Persistent storage not granted');
  } catch (error) {
    console.warn('Failed to request persistent storage', error);
  }
}
