const PromotionCards = () => {
  return (
    <div className="row gy-6 mb-6">
      <div className="col-lg-6">
        <div className="card shadow-none bg-label-primary h-100">
          <div className="card-body d-flex justify-content-between flex-wrap-reverse">
            <div className="mb-0 w-100 app-academy-sm-60 d-flex flex-column justify-content-between text-center text-sm-start">
              <div className="card-title">
                <h5 className="text-primary mb-2">Earn a Certificate</h5>
                <p className="text-body w-sm-80 app-academy-xl-100">
                  Get the right professional certificate program for you.
                </p>
              </div>
              <div className="mb-0">
                <button className="btn btn-sm btn-primary">View Programs</button>
              </div>
            </div>
            <div className="w-100 app-academy-sm-40 d-flex justify-content-center justify-content-sm-end h-px-150 mb-4 mb-sm-0">
              <img
                className="img-fluid scaleX-n1-rtl"
                src="../../assets/img/illustrations/boy-app-academy.png"
                alt="boy illustration"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="col-lg-6">
        <div className="card shadow-none bg-label-danger h-100">
          <div className="card-body d-flex justify-content-between flex-wrap-reverse">
            <div className="mb-0 w-100 app-academy-sm-60 d-flex flex-column justify-content-between text-center text-sm-start">
              <div className="card-title">
                <h5 className="text-danger mb-2">Best Rated Quizzes</h5>
                <p className="text-body app-academy-sm-60 app-academy-xl-100">
                  Enroll now in the most popular and best rated quizzes.
                </p>
              </div>
              <div className="mb-0">
                <button className="btn btn-sm btn-danger">View Quizzes</button>
              </div>
            </div>
            <div className="w-100 app-academy-sm-40 d-flex justify-content-center justify-content-sm-end h-px-150 mb-4 mb-sm-0">
              <img
                className="img-fluid scaleX-n1-rtl"
                src="../../assets/img/illustrations/girl-app-academy.png"
                alt="girl illustration"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionCards;