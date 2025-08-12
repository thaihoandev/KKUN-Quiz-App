import unknownAvatar from "@/assets/img/avatars/unknown.jpg";

export default function OnlineWidget() {
  return (
    <div className="card shadow-sm border-0 rounded-4">
      <div className="card-body">
        <h6 className="fw-bold mb-3">Online</h6>
        <div className="d-flex flex-wrap gap-3">
          {[
            { id: "o1", name: "Trang", avatar: unknownAvatar },
            { id: "o2", name: "Phúc", avatar: unknownAvatar },
            { id: "o3", name: "Khoa", avatar: unknownAvatar },
            { id: "o4", name: "Vy", avatar: unknownAvatar },
          ].map((f) => (
            <div key={f.id} className="text-center" title={f.name}>
              <div className="position-relative mx-auto" style={{ width: 44, height: 44 }}>
                <img
                  src={f.avatar}
                  alt={f.name}
                  className="rounded-circle"
                  width={44}
                  height={44}
                  style={{ objectFit: "cover" }}
                />
                <span
                  className="position-absolute bottom-0 end-0 bg-success rounded-circle border border-2 border-white"
                  style={{ width: 10, height: 10 }}
                />
              </div>
              <small className="d-block mt-1 text-truncate" style={{ maxWidth: 64 }}>
                {f.name}
              </small>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
