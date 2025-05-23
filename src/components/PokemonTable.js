import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Typography, 
  Box, 
  CircularProgress,
  Container,
  Alert,
  Chip,
  useTheme,
  Avatar,
  Card,
  CardMedia,
  CardContent,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Fab,
  Tooltip
} from '@mui/material';
import CatchingPokemonIcon from '@mui/icons-material/CatchingPokemon';
import SportsKabaddiIcon from '@mui/icons-material/SportsKabaddi';
import CloseIcon from '@mui/icons-material/Close';
import BattleSimulator from './BattleSimulator';

const PokemonTable = () => {
  const theme = useTheme();
  const [pokemonData, setPokemonData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPokemon, setSelectedPokemon] = useState([]);
  const [battleDialogOpen, setBattleDialogOpen] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '' });

  useEffect(() => {
    const fetchPokemon = async () => {
      try {
        const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=100');
        const data = await response.json();
        
        // Fetch details for each Pokémon
        const pokemonPromises = data.results.map(async (pokemon) => {
          const detailResponse = await fetch(pokemon.url);
          const detailData = await detailResponse.json();
          // Get animated sprite if available, otherwise fallback to static sprite
          const animatedSprite = detailData.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default;
          
          return {
            name: detailData.name,
            id: detailData.id,
            types: detailData.types.map(type => type.type.name),
            height: detailData.height,
            weight: detailData.weight,
            image: animatedSprite || detailData.sprites.front_default,
            baseExperience: detailData.base_experience,
            abilities: detailData.abilities.map(ability => ability.ability.name)
          };
        });

        const pokemonDetails = await Promise.all(pokemonPromises);
        setPokemonData(pokemonDetails);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch Pokémon data');
        setLoading(false);
      }
    };

    fetchPokemon();
  }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mt: 4, height: '50vh' }}>
      <CatchingPokemonIcon sx={{ fontSize: 60, color: 'primary.main', animation: 'spin 1s linear infinite', mb: 2 }} />
      <Typography variant="h6" fontFamily="'Press Start 2P', cursive" sx={{ mt: 2 }}>
        Loading Pokémon...
      </Typography>
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Box>
  );
  if (error) return <Alert severity="error" icon={<CatchingPokemonIcon />}>{error}</Alert>;

  const handlePokemonSelect = (pokemon) => {
    setSelectedPokemon(prev => {
      // If already selected, remove it
      if (prev.some(p => p.id === pokemon.id)) {
        return prev.filter(p => p.id !== pokemon.id);
      }
      
      // If we already have 2 selected, replace the oldest one
      if (prev.length >= 2) {
        const newSelection = [...prev];
        newSelection.shift(); // Remove the first (oldest) Pokemon
        return [...newSelection, pokemon];
      }
      
      // Otherwise add it to selected
      return [...prev, pokemon];
    });
  };

  const handleStartBattle = () => {
    if (selectedPokemon.length !== 2) {
      setNotification({
        open: true,
        message: 'Please select exactly 2 Pokémon for battle!'
      });
      return;
    }
    
    setBattleDialogOpen(true);
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handleCloseBattleDialog = () => {
    setBattleDialogOpen(false);
  };

  return (
    <Box 
      sx={{
        backgroundImage: 'linear-gradient(to bottom, #f0f8ff, #e6f2ff)',
        minHeight: '100vh',
        pt: 4,
        pb: 8,
        position: 'relative' // For the fixed battle button
      }}
    >
      <Container maxWidth="lg">
        <Box 
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4
          }}
        >
          <CatchingPokemonIcon 
            sx={{ 
              fontSize: 50, 
              color: 'primary.main',
              mb: 2
            }} 
          />
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom 
            sx={{ 
              textAlign: 'center',
              color: 'primary.main',
              textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
              fontFamily: "'Press Start 2P', cursive",
              fontSize: { xs: '1.5rem', md: '2rem' }
            }}
          >
            Pokémon Database
          </Typography>
        </Box>

        <Box 
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
            gap: 3,
            mb: 4
          }}
        >
          {pokemonData.map((pokemon) => (
            <Card 
              key={pokemon.id} 
              onClick={() => handlePokemonSelect(pokemon)}
              sx={{
                borderRadius: 4,
                overflow: 'hidden',
                transition: 'all 0.3s',
                boxShadow: 3,
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 6,
                },
                // Add a border if this Pokémon is selected
                border: selectedPokemon.some(p => p.id === pokemon.id) ? `3px solid ${theme.palette.primary.main}` : 'none',
                position: 'relative',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundImage: 'url(https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png)',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 10px bottom 10px',
                  backgroundSize: '30px',
                  opacity: 0.1,
                  zIndex: 0
                }
              }}
            >
              <Box 
                sx={{
                  bgcolor: theme.palette.pokemonTypes[pokemon.types[0]] || 'primary.main',
                  p: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Typography 
                  sx={{ 
                    color: 'white', 
                    fontWeight: 'bold',
                    textTransform: 'capitalize',
                    fontSize: '1.1rem'
                  }}
                >
                  {pokemon.name}
                </Typography>
                <Typography 
                  sx={{ 
                    color: 'rgba(255,255,255,0.8)', 
                    fontFamily: "'Press Start 2P', cursive",
                    fontSize: '0.7rem'
                  }}
                >
                  #{pokemon.id.toString().padStart(3, '0')}
                </Typography>
              </Box>
              
              <Box 
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  p: 3,
                  background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(240,240,240,1) 100%)'
                }}
              >
                <Box 
                  component="img" 
                  src={pokemon.image} 
                  alt={pokemon.name}
                  sx={{ 
                    width: 120, 
                    height: 120,
                    filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))',
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'scale(1.1) rotate(5deg)'
                    }
                  }}
                />
              </Box>
              
              <CardContent>
                <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                  {pokemon.types.map(type => (
                    <Chip 
                      key={type} 
                      label={type}
                      size="small"
                      sx={{ 
                        textTransform: 'capitalize',
                        bgcolor: theme.palette.pokemonTypes[type] || 'primary.main',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  ))}
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Height: {pokemon.height / 10} m
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Weight: {pokemon.weight / 10} kg
                  </Typography>
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Base Exp: {pokemon.baseExperience}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                  Abilities:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {pokemon.abilities.map((ability, index) => (
                    <Typography key={index} variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                      {ability}{index < pokemon.abilities.length - 1 ? ',' : ''}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Battle FAB button - appears when at least one Pokemon is selected */}
        {selectedPokemon.length > 0 && (
          <Tooltip 
            title={`Battle with ${selectedPokemon.length} selected Pokémon${selectedPokemon.length === 1 ? ' (select one more)' : ''}`}
            placement="left"
          >
            <Fab
              color="primary"
              aria-label="battle"
              sx={{
                position: 'fixed',
                bottom: 20,
                right: 20,
                fontFamily: "'Press Start 2P', cursive",
                fontSize: '0.6rem',
                animation: selectedPokemon.length === 2 ? 'pulse 1.5s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { boxShadow: '0 0 0 0 rgba(255, 0, 0, 0.7)' },
                  '70%': { boxShadow: '0 0 0 15px rgba(255, 0, 0, 0)' },
                  '100%': { boxShadow: '0 0 0 0 rgba(255, 0, 0, 0)' }
                },
                bgcolor: theme.palette.primary.main,
                '&:hover': {
                  bgcolor: theme.palette.primary.dark
                }
              }}
              onClick={handleStartBattle}
            >
              <SportsKabaddiIcon />
            </Fab>
          </Tooltip>
        )}

        {/* Selection counter */}
        {selectedPokemon.length > 0 && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 20,
              left: 20,
              bgcolor: 'rgba(255,255,255,0.9)',
              p: 2,
              borderRadius: 2,
              boxShadow: 3,
              display: 'flex',
              alignItems: 'center',
              zIndex: 10
            }}
          >
            <Typography fontFamily="'Press Start 2P', cursive" fontSize="0.7rem" mr={1}>
              Selected: {selectedPokemon.length}/2
            </Typography>
            {selectedPokemon.map((pokemon) => (
              <Box 
                key={pokemon.id}
                component="img"
                src={pokemon.image}
                alt={pokemon.name}
                sx={{ 
                  width: 40, 
                  height: 40,
                  mr: 1
                }}
              />
            ))}
            {selectedPokemon.length > 0 && (
              <IconButton 
                size="small" 
                onClick={() => setSelectedPokemon([])} 
                sx={{ ml: 'auto' }}
                color="error"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        )}
      </Container>

      {/* Battle Dialog */}
      <Dialog
        open={battleDialogOpen}
        onClose={handleCloseBattleDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 4,
            bgcolor: '#f9f9f9'
          }
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          {selectedPokemon.length === 2 && (
            <BattleSimulator 
              pokemon1={selectedPokemon[0]} 
              pokemon2={selectedPokemon[1]} 
              onClose={handleCloseBattleDialog} 
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleCloseNotification}
        message={notification.message}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleCloseNotification}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Box>
  );
};

export default PokemonTable;
