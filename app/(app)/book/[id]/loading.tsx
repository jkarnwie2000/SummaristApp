export default function Loading() {
  return (
    <div className="row book-page__row">
      <div className="container book-page__container">
        <div className="inner__wrapper">
          <div className="inner__book">
            <div className="skeleton skeleton-text-1"></div>
            <div className="skeleton skeleton-text-2"></div>
            <div className="inner-book__read--btn-wrapper">
              <div className="skeleton skeleton-btn1"></div>
              <div className="skeleton skeleton-btn1"></div>
            </div>
            <div className="inner-book__book--description">
              <div className="skeleton skeleton-linea short"></div>
              <div className="skeleton skeleton-line1"></div>
              <div className="skeleton skeleton-linea short"></div>
              <div className="skeleton skeleton-line1"></div>
            </div>
          </div>
          <div className="inner-book--img-wrapper">
            <div className="skeleton skeleton-image1"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
