import { createTheme } from '@mui/material/styles';
import '@fontsource/press-start-2p';
import '@fontsource/roboto';

const theme = createTheme({
  palette: {
    primary: {
      main: '#FF0000', // Pokéball red
      dark: '#CC0000', 
      light: '#FF5A5A',
    },
    secondary: {
      main: '#3B4CCA', // Pokémon blue
      dark: '#30409F',
      light: '#5670FF',
    },
    background: {
      default: '#f0f0f0',
      paper: '#ffffff',
    },
    pokemonTypes: {
      fire: '#F08030',
      water: '#6890F0',
      grass: '#78C850',
      electric: '#F8D030',
      psychic: '#F85888',
      ice: '#98D8D8',
      dragon: '#7038F8',
      dark: '#705848',
      fairy: '#EE99AC',
      normal: '#A8A878',
      fighting: '#C03028',
      flying: '#A890F0',
      poison: '#A040A0',
      ground: '#E0C068',
      rock: '#B8A038',
      bug: '#A8B820',
      ghost: '#705898',
      steel: '#B8B8D0',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Arial", sans-serif',
    h1: {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '2.5rem',
    },
    h2: {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '2rem',
    },
    h3: {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '1.75rem',
    },
    h4: {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '1.5rem',
    },
    h5: {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '1.25rem',
    },
    h6: {
      fontFamily: '"Press Start 2P", cursive',
      fontSize: '1rem',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 'bold',
          backgroundColor: '#FF0000',
          color: 'white',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:nth-of-type(odd)': {
            backgroundColor: 'rgba(0, 0, 0, 0.03)',
          },
        },
      },
    },
  },
});

export default theme;
