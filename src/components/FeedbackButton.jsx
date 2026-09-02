function FeedbackButton() {
  return (
    <a
      href="https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=o6hYNyq_bUuqce_63KT3Ta7fqjmMiadGmU6Gof7Q8-pUNk1DOTQ1RjM0R0lMVzY0SldXOUtPVjRESC4u"
      target="_blank"
      rel="noopener noreferrer"
      className="feedback-btn"
      aria-label="Share feedback"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
      </svg>
      <span>Feedback</span>
    </a>
  );
}

export default FeedbackButton;
