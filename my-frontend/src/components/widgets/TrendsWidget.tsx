export default function TrendsWidget() {
  return (
    <div className="card shadow-sm border-0 rounded-4 mb-4">
      <div className="card-body">
        <h6 className="fw-bold mb-3">Trends for you</h6>
        <ul className="list-unstyled mb-0">
          {[
            { tag: "#javascript", posts: 1240 },
            { tag: "#webdev", posts: 980 },
            { tag: "#datascience", posts: 720 },
            { tag: "#uxui", posts: 610 },
          ].map((t) => (
            <li key={t.tag} className="mb-3">
              <div className="fw-semibold">{t.tag}</div>
              <small className="text-muted">{t.posts.toLocaleString()} posts</small>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
