import {
  MapPin,
  Phone,
  Clock,
  Star,
  Flower2,
  ArrowUpRight,
} from 'lucide-react';
const listing = 'https://2gis.kz/astana/firm/70000001067393553';
// Official DGWidgetLoader iframe format. Coordinates come from the business listing,
// rather than the viewport center in the shared URL.
const mapUrl =
  'https://widgets.2gis.com/widget?type=firmsonmap&options=' +
  encodeURIComponent(
    JSON.stringify({
      pos: { lat: 51.14245, lon: 71.420112, zoom: 16 },
      opt: { city: 'astana' },
      org: '70000001067393553',
    }),
  );
// Manually checked against the public 2GIS listing on 2026-09-27.
// Brief verbatim review text; the first quote is an excerpt. Not a live feed.
const reviewHighlights = [
  {
    author: 'Мадияр Айтжанов',
    initials: 'МА',
    rating: 5,
    quote: '…Цветы свежие, оформление невероятно красивое.…',
  },
  {
    author: 'Sandi K',
    initials: 'SK',
    rating: 5,
    quote: 'Уже 3 года постоянные клиенты здесь. Всегда отличный сервис и свежие цветы, адекватные цены👍🏻',
  },
];

export default function HomeVisit() {
  return (
    <>
      <section className="home-visit" aria-labelledby="visit-heading">
        <div className="home-section-heading">
          <div>
            <p className="eyebrow">БУДЕМ РАДЫ ВСТРЕЧЕ</p>
            <h2 id="visit-heading">Как нас найти</h2>
          </div>
          <span className="placeholder-label">
            Пример расположения · Flowers world
          </span>
        </div>
        <div className="visit-layout">
          <div className="visit-map">
            <iframe
              src={mapUrl}
              title="2ГИС: Flowers world, Астана, проспект Кабанбай батыра, 14"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
            <a href={listing} target="_blank" rel="noopener noreferrer">
              Открыть карту в 2ГИС <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          </div>
          <div className="visit-details">
            <h3>Flowers world</h3>
            <p className="visit-intro">
              Центр цветов и подарков в Астане.
              <br />
              Пример магазина для этой страницы.
            </p>
            <dl>
              <div>
                <MapPin aria-hidden="true" />
                <dt>Адрес</dt>
                <dd>Астана, проспект Кабанбай батыра, 14</dd>
              </div>
              <div>
                <Phone aria-hidden="true" />
                <dt>Телефон из карточки 2ГИС</dt>
                <dd>
                  <a href="tel:+77082851667">+7 708 285-16-67</a>
                </dd>
              </div>
              <div>
                <Clock aria-hidden="true" />
                <dt>Часы работы</dt>
                <dd>
                  Ежедневно, 09:30–01:00
                  <br />
                  <small>До часа ночи следующего дня</small>
                </dd>
              </div>
            </dl>
            <a
              className="home-text-link"
              href="https://2gis.kz/astana/directions/points/%7C71.420112%2C51.14245%3B70000001067393553"
              target="_blank"
              rel="noopener noreferrer"
            >
              Построить маршрут <ArrowUpRight size={18} aria-hidden="true" />
            </a>
            <p className="visit-source">
              По данным 2ГИС. Перед визитом уточните часы работы в карточке
              магазина.
            </p>
          </div>
        </div>
      </section>
      <section id="reviews" className="home-reviews" aria-labelledby="reviews-heading">
        <Flower2 className="review-flower" size={32} aria-hidden="true" />
        <p className="eyebrow">ВПЕЧАТЛЕНИЯ ПОКУПАТЕЛЕЙ</p>
        <h2 id="reviews-heading">Отзывы о Flowers world</h2>
        <p className="reviews-intro">
          Пример раздела для вашего магазина: реальные отзывы о Flowers world в 2ГИС.
        </p>
        <div className="reviews-overview">
          <span className="reviews-score"><Star size={23} fill="currentColor" aria-hidden="true" /> 4,9 <span>из 5</span></span>
          <span>796 оценок в 2ГИС</span>
        </div>
        <ul className="review-cards" aria-label="Отзывы из 2ГИС">
          {reviewHighlights.map((review) => (
            <li key={review.author} className="review-card">
              <div className="review-person">
                <span className="review-avatar" aria-hidden="true">{review.initials}</span>
                <div>
                  <h3>{review.author}</h3>
                  <span className="review-origin">Покупатель Flowers world · 2ГИС</span>
                </div>
              </div>
              <div className="review-rating" role="img" aria-label={`Оценка: ${review.rating} из 5`}>
                {Array.from({ length: 5 }, (_, index) => (
                  <Star key={index} size={16} fill={index < review.rating ? 'currentColor' : 'none'} aria-hidden="true" />
                ))}
                <span aria-hidden="true">{review.rating}/5</span>
              </div>
              <blockquote><p>{review.quote}</p></blockquote>
            </li>
          ))}
        </ul>
        <a className="home-text-link" href={listing + '/tab/reviews'} target="_blank" rel="noopener noreferrer">
          Все отзывы в 2ГИС <ArrowUpRight size={18} aria-hidden="true" />
        </a>
        <p className="reviews-source">
          Данные проверены <time dateTime="2026-09-27">27 сентября 2026</time>.
          Отзывы и рейтинг не обновляются автоматически. Полные тексты — в 2ГИС.
        </p>
      </section>
    </>
  );
}
