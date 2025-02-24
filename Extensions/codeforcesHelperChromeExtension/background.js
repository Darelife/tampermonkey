chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set(
    {
      participantsEnabled: true,
      tagsEnabled: true,
      submissionsEnabled: true,
    },
    () => {
      console.log("Default settings have been set.");
    }
  );
});
