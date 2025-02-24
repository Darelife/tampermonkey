browser.runtime.onInstalled.addListener(() => {
  browser.storage.sync.set(
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
