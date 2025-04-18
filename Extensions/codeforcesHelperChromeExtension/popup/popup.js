document.addEventListener("DOMContentLoaded", () => {
  const tagToggle = document.getElementById("toggle-tags");
  const submissionToggle = document.getElementById("toggle-submissions");
  const participantToggle = document.getElementById("toggle-participants");
  const saveQuestionsToggle = document.getElementById("toggle-savequestions");
  const multiUserRatingGraphToggle = document.getElementById(
    "toggle-multiuserratinggraph"
  );

  chrome.storage.sync.get(
    [
      "tagsEnabled",
      "submissionsEnabled",
      "participantsEnabled",
      "saveQuestionsEnabled",
      "multiUserRatingGraphEnabled",
    ],
    (settings) => {
      tagToggle.checked = settings.tagsEnabled ?? true;
      submissionToggle.checked = settings.submissionsEnabled ?? true;
      participantToggle.checked = settings.participantsEnabled ?? true;
      saveQuestionsToggle.checked = settings.saveQuestionsEnabled ?? true;
      multiUserRatingGraphToggle.checked =
        settings.multiUserRatingGraphEnabled ?? true;
    }
  );

  const savePreferences = () => {
    chrome.storage.sync.set(
      {
        tagsEnabled: tagToggle.checked,
        submissionsEnabled: submissionToggle.checked,
        participantsEnabled: participantToggle.checked,
        saveQuestionsEnabled: saveQuestionsToggle.checked,
        multiUserRatingGraphEnabled: multiUserRatingGraphToggle.checked,
      },
      () => {
        console.log("Settings saved:", {
          tagsEnabled: tagToggle.checked,
          submissionsEnabled: submissionToggle.checked,
          participantsEnabled: participantToggle.checked,
          saveQuestionsEnabled: saveQuestionsToggle.checked,
          multiUserRatingGraphEnabled: multiUserRatingGraphToggle.checked,
        });
      }
    );
  };

  tagToggle.addEventListener("change", savePreferences);
  submissionToggle.addEventListener("change", savePreferences);
  participantToggle.addEventListener("change", savePreferences);
  saveQuestionsToggle.addEventListener("change", savePreferences);
  multiUserRatingGraphToggle.addEventListener("change", savePreferences);
});
