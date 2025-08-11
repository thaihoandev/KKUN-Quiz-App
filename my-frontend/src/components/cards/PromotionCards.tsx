import boy from "@/assets/img/illustrations/boy-app-academy.png";
import girl from "@/assets/img/illustrations/girl-app-academy.png";

const PromotionCards = () => {
  return (
    <div className="row gy-6 mb-6">
      {/* Card 1 */}
      <div className="col-lg-6">
        <div className="card border-0 shadow-sm h-100 rounded-4 bg-label-primary">
          <div className="card-body">
            <div className="row align-items-center">
              {/* Content: 8 cols on md+ */}
              <div className="col-12 col-md-8 order-2 order-md-1 text-center text-md-start">
                <div className="card-title">
                  <h5 className="text-primary mb-2">Earn a Certificate</h5>
                  <p className="text-body mb-3">
                    Get the right professional certificate program for you.
                  </p>
                </div>
                <button className="btn btn-sm btn-primary rounded-3">
                  View Programs
                </button>
              </div>

              {/* Image: 4 cols on md+ */}
              <div className="col-12 col-md-4 order-1 order-md-2 text-center text-md-end mb-4 mb-md-0">
                <img
                  className="img-fluid"
                  src={boy}
                  alt="boy illustration"
                  style={{ maxHeight: 150, objectFit: "contain" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card 2 */}
      <div className="col-lg-6">
        <div className="card border-0 shadow-sm h-100 rounded-4 bg-label-danger">
          <div className="card-body">
            <div className="row align-items-center">
              {/* Content: 8 cols on md+ */}
              <div className="col-12 col-md-8 order-2 order-md-1 text-center text-md-start">
                <div className="card-title">
                  <h5 className="text-danger mb-2">Best Rated Quizzes</h5>
                  <p className="text-body mb-3">
                    Enroll now in the most popular and best rated quizzes.
                  </p>
                </div>
                <button className="btn btn-sm btn-danger rounded-3">
                  View Quizzes
                </button>
              </div>

              {/* Image: 4 cols on md+ */}
              <div className="col-12 col-md-4 order-1 order-md-2 text-center text-md-end mb-4 mb-md-0">
                <img
                  className="img-fluid"
                  src={girl}
                  alt="girl illustration"
                  style={{ maxHeight: 150, objectFit: "contain" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionCards;
