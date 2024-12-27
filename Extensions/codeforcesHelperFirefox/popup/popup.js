document.addEventListener("DOMContentLoaded", () => {
  const tagToggle = document.getElementById("toggle-tags");
  const submissionToggle = document.getElementById("toggle-submissions");
  const participantToggle = document.getElementById("toggle-participants");

  browser.storage.sync.get(
    ["tagsEnabled", "submissionsEnabled", "participantsEnabled"],
    (settings) => {
      tagToggle.checked = settings.tagsEnabled ?? true;
      submissionToggle.checked = settings.submissionsEnabled ?? true;
      participantToggle.checked = settings.participantsEnabled ?? true;
    }
  );

  const savePreferences = () => {
    browser.storage.sync.set(
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

  tagToggle.addEventListener("change", savePreferences);
  submissionToggle.addEventListener("change", savePreferences);
  participantToggle.addEventListener("change", savePreferences);
});
