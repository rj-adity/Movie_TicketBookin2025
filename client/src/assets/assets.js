import logo from './logo.svg';
import backgroundImage from './backgroundImage.png';
import screenImage from './screenImage.svg';
import marvelLogo from './marvelLogo.svg';
import googlePlay from './googlePlay.svg';
import appStore from './appStore.svg';

export const assets = {
  logo,
  backgroundImage,
  screenImage,
  marvelLogo,
  googlePlay,
  appStore,
};

export const dummyTrailers = [
  {
    image: 'https://img.youtube.com/vi/5PSNL1qE6VY/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/watch?v=5PSNL1qE6VY',
  },
  {
    image: 'https://img.youtube.com/vi/6ZfuNTqbHE8/maxresdefault.jpg',
    videoUrl: 'https://youtu.be/6ZfuNTqbHE8',
  },
  {
    image: 'https://img.youtube.com/vi/8ugaeA-nMTc/maxresdefault.jpg',
    videoUrl: 'https://youtu.be/8ugaeA-nMTc',
  },
  {
    image: 'https://img.youtube.com/vi/TcMBFSGVi1c/maxresdefault.jpg',
    videoUrl: 'https://youtu.be/TcMBFSGVi1c',
  },
];

export const dummyDateTimeData = [
  { date: '2026-05-15', time: '10:00' },
  { date: '2026-05-15', time: '14:00' },
  { date: '2026-05-15', time: '18:00' },
  { date: '2026-05-15', time: '21:00' },
];

export const dummyShowsData = [
  {
    id: 'show-1',
    movieId: 'movie-1',
    dateTime: {
      '2026-05-15': [{ time: '10:00', showId: 's1-1' }, { time: '14:00', showId: 's1-2' }],
      '2026-05-16': [{ time: '11:00', showId: 's1-3' }, { time: '15:00', showId: 's1-4' }],
    },
  },
];