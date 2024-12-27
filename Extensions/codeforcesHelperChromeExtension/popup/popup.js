document.addEventListener("DOMContentLoaded", () => {
  const tagToggle = document.getElementById("toggle-tags");
  const submissionToggle = document.getElementById("toggle-submissions");
  const participantToggle = document.getElementById("toggle-participants");

  // Load saved preferences
  chrome.storage.sync.get(
    ["tagsEnabled", "submissionsEnabled", "participantsEnabled"],
    (settings) => {
      tagToggle.checked = settings.tagsEnabled ?? true;
      submissionToggle.checked = settings.submissionsEnabled ?? true;
      participantToggle.checked = settings.participantsEnabled ?? true;
    }
  );

  // Function to save preferences
  const savePreferences = () => {
    chrome.storage.sync.set(
      {
        tagsEnabled: tagToggle.checked,
        submissionsEnabled: submissionToggle.checked,
        participantsEnabled: participantToggle.checked,
      },
      () => {
        console.log("Settings saved:", {
          tagsEnabled: tagToggle.checked,
          submissionsEnabled: submissionToggle.checked,
          participantsEnabled: participantToggle.checked,
        });
      }
    );
  };

  // Add event listeners to toggles
  tagToggle.addEventListener("change", savePreferences);
  submissionToggle.addEventListener("change", savePreferences);
  participantToggle.addEventListener("change", savePreferences);
});
