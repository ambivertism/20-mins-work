import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  useTheme,
  Chip,
  Grid,
  LinearProgress,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SportsKabaddiIcon from '@mui/icons-material/SportsKabaddi';

const BattleSimulator = ({ pokemon1, pokemon2, onClose }) => {
  const theme = useTheme();
  const [battleLog, setBattleLog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pokemon1Details, setPokemon1Details] = useState(null);
  const [pokemon2Details, setPokemon2Details] = useState(null);
  const [battleInProgress, setBattleInProgress] = useState(false);
  const [battleEnded, setBattleEnded] = useState(false);
  const [winner, setWinner] = useState(null);
  const [pokemon1HP, setPokemon1HP] = useState(100);
  const [pokemon2HP, setPokemon2HP] = useState(100);
  const [currentTurn, setCurrentTurn] = useState(1); // 1 for player 1, 2 for player 2
  const [battleStarted, setBattleStarted] = useState(false);
  const [pokemon1Level, setPokemon1Level] = useState(50);
  const [pokemon2Level, setPokemon2Level] = useState(50);
  const [pokemon1Moves, setPokemon1Moves] = useState([]);
  const [pokemon2Moves, setPokemon2Moves] = useState([]);
  const [setupComplete, setSetupComplete] = useState(false);
  const [showLevelSelect, setShowLevelSelect] = useState(true);

  useEffect(() => {
    const fetchPokemonDetails = async () => {
      try {
        // Fetch detailed data for both Pokémon, including moves
        const [response1, response2] = await Promise.all([
          fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon1.name}`),
          fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon2.name}`)
        ]);
        
        const data1 = await response1.json();
        const data2 = await response2.json();
        
        // Process Pokémon data but don't yet finalize moves (waiting for level selection)
        const processedPokemon1 = processPokemonData(data1);
        const processedPokemon2 = processPokemonData(data2);
        
        setPokemon1Details(processedPokemon1);
        setPokemon2Details(processedPokemon2);
        
        // Fetch evolution data to help determine appropriate levels
        const speciesResponse1 = await fetch(data1.species.url);
        const speciesData1 = await speciesResponse1.json();
        
        const speciesResponse2 = await fetch(data2.species.url);
        const speciesData2 = await speciesResponse2.json();
        
        // Set suggested levels based on evolution chain position
        const suggestedLevel1 = getSuggestedLevel(speciesData1);
        const suggestedLevel2 = getSuggestedLevel(speciesData2);
        
        setPokemon1Level(suggestedLevel1);
        setPokemon2Level(suggestedLevel2);
        
        // Set initial HP based on stats and level
        const hp1 = calculateHP(processedPokemon1.baseStats.hp, suggestedLevel1);
        const hp2 = calculateHP(processedPokemon2.baseStats.hp, suggestedLevel2);
        
        setPokemon1HP(hp1);
        setPokemon2HP(hp2);
        
        // Fetch move details for both Pokémon
        await fetchMoveDetails(processedPokemon1, processedPokemon2);
        
        setBattleLog([`A battle between ${processedPokemon1.name} and ${processedPokemon2.name} is about to begin!`]);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching Pokémon details:', error);
        setBattleLog([`Error loading battle data: ${error.message}`]);
        setIsLoading(false);
      }
    };

    fetchPokemonDetails();
  }, [pokemon1, pokemon2]);
  
  // Calculate suggested level based on evolution stage
  const getSuggestedLevel = (speciesData) => {
    // Base level is higher for fully evolved Pokémon, lower for base forms
    let baseLevel = 50;
    
    // Check if this is the first evolution in the chain
    if (!speciesData.evolves_from_species) {
      // This is a base form
      return Math.max(5, baseLevel - 30);
    }
    
    // Check if this can evolve further
    if (speciesData.evolution_chain) {
      const hasEvolution = speciesData.evolution_chain.evolves_to && speciesData.evolution_chain.evolves_to.length > 0;
      if (!hasEvolution) {
        // This is a fully evolved form
        return baseLevel + 20;
      }
    }
    
    // This is a middle evolution
    return baseLevel;
  };
  
  // Calculate HP based on base stat and level
  const calculateHP = (baseStat, level) => {
    return Math.floor((2 * baseStat * level / 100) + level + 10);
  };
  
  // Calculate other stats based on base stat and level
  const calculateStat = (baseStat, level) => {
    return Math.floor((2 * baseStat * level / 100) + 5);
  };
  
  // Fetch detailed move information
  const fetchMoveDetails = async (pokemon1, pokemon2) => {
    try {
      // Fetch move details for both Pokémon
      const fetchMovesForPokemon = async (pokemon, level, setMoves) => {
        // Get moves appropriate for the Pokémon's level
        const levelUpMoves = pokemon.movesByMethod.levelup
          .filter(move => move.level <= level)
          .sort((a, b) => b.level - a.level); // Sort by level in descending order
        
        // Prioritize most recent moves learned
        let selectedMoves = levelUpMoves.slice(0, 4);
        
        // If we don't have 4 moves, add some from other methods
        if (selectedMoves.length < 4) {
          const otherMoves = [
            ...pokemon.movesByMethod.machine,
            ...pokemon.movesByMethod.tutor,
            ...pokemon.movesByMethod.egg
          ].slice(0, 4 - selectedMoves.length);
          
          selectedMoves = [...selectedMoves, ...otherMoves];
        }
        
        // If we still don't have 4 moves, just use what we have
        if (selectedMoves.length === 0) {
          selectedMoves = [{name: 'tackle', url: 'https://pokeapi.co/api/v2/move/33/'}];
        }
        
        // Fetch details for each move
        const moveDetailsPromises = selectedMoves.map(async (move) => {
          try {
            const moveUrl = move.url;
            const response = await fetch(moveUrl);
            const moveData = await response.json();
            
            return {
              id: moveData.id,
              name: moveData.name,
              type: moveData.type.name,
              power: moveData.power || 40, // Default power if not specified
              accuracy: moveData.accuracy || 100,
              pp: moveData.pp || 10,
              damageClass: moveData.damage_class?.name || 'physical',
              effectChance: moveData.effect_chance,
              effect: moveData.effect_entries.length > 0 ? 
                moveData.effect_entries[0].short_effect : 'No effect description available.'
            };
          } catch (err) {
            console.error(`Error fetching move details for ${move.name}:`, err);
            // Return a default move if there's an error
            return {
              id: 0,
              name: move.name,
              type: 'normal',
              power: 40,
              accuracy: 100,
              pp: 10,
              damageClass: 'physical',
              effectChance: 0,
              effect: 'A basic attack.'
            };
          }
        });
        
        const moveDetails = await Promise.all(moveDetailsPromises);
        setMoves(moveDetails);
      };
      
      // Fetch moves for both Pokémon
      await Promise.all([
        fetchMovesForPokemon(pokemon1, pokemon1Level, setPokemon1Moves),
        fetchMovesForPokemon(pokemon2, pokemon2Level, setPokemon2Moves)
      ]);
      
      setSetupComplete(true);
    } catch (error) {
      console.error('Error fetching move details:', error);
      setBattleLog(prev => [...prev, `Error loading move data: ${error.message}`]);
    }
  };

  // Process raw Pokemon data into a more useful format for battle
  const processPokemonData = (rawData) => {
    // Organize moves by learning method for better selection later
    const movesByMethod = {
      levelup: [],
      machine: [],
      tutor: [],
      egg: [],
      other: []
    };
    
    // Process and categorize moves
    rawData.moves.forEach(moveData => {
      const moveName = moveData.move.name;
      const moveUrl = moveData.move.url;
      
      // Find the most relevant version group details
      const versionDetails = moveData.version_group_details
        .sort((a, b) => {
          // Sort by most recent game version
          return b.version_group.name.localeCompare(a.version_group.name);
        })[0]; // Take the most recent
      
      if (versionDetails) {
        const method = versionDetails.move_learn_method.name;
        const level = versionDetails.level_learned_at;
        
        if (method === 'level-up') {
          movesByMethod.levelup.push({ name: moveName, level, url: moveUrl });
        } else if (method === 'machine') {
          movesByMethod.machine.push({ name: moveName, url: moveUrl });
        } else if (method === 'tutor') {
          movesByMethod.tutor.push({ name: moveName, url: moveUrl });
        } else if (method === 'egg') {
          movesByMethod.egg.push({ name: moveName, url: moveUrl });
        } else {
          movesByMethod.other.push({ name: moveName, url: moveUrl });
        }
      }
    });
    
    // Sort level-up moves by level
    movesByMethod.levelup.sort((a, b) => a.level - b.level);
    
    // Extract base stats
    const baseStats = {
      hp: rawData.stats.find(stat => stat.stat.name === 'hp')?.base_stat || 50,
      attack: rawData.stats.find(stat => stat.stat.name === 'attack')?.base_stat || 50,
      defense: rawData.stats.find(stat => stat.stat.name === 'defense')?.base_stat || 50,
      special_attack: rawData.stats.find(stat => stat.stat.name === 'special-attack')?.base_stat || 50,
      special_defense: rawData.stats.find(stat => stat.stat.name === 'special-defense')?.base_stat || 50,
      speed: rawData.stats.find(stat => stat.stat.name === 'speed')?.base_stat || 50
    };
    
    return {
      id: rawData.id,
      name: rawData.name,
      types: rawData.types.map(type => type.type.name),
      baseStats: baseStats,
      movesByMethod: movesByMethod,
      image: rawData.sprites.front_default,
      animatedImage: rawData.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default || rawData.sprites.front_default
    };
  };

  const confirmSetup = () => {
    // Update stats based on levels
    updatePokemonStats();
    setShowLevelSelect(false);
  };
  
  const updatePokemonStats = () => {
    // Recalculate stats based on current levels
    if (pokemon1Details && pokemon2Details) {
      // Calculate HP and other stats based on level
      const pokemon1Stats = {
        hp: calculateHP(pokemon1Details.baseStats.hp, pokemon1Level),
        attack: calculateStat(pokemon1Details.baseStats.attack, pokemon1Level),
        defense: calculateStat(pokemon1Details.baseStats.defense, pokemon1Level),
        special_attack: calculateStat(pokemon1Details.baseStats.special_attack, pokemon1Level),
        special_defense: calculateStat(pokemon1Details.baseStats.special_defense, pokemon1Level),
        speed: calculateStat(pokemon1Details.baseStats.speed, pokemon1Level)
      };
      
      const pokemon2Stats = {
        hp: calculateHP(pokemon2Details.baseStats.hp, pokemon2Level),
        attack: calculateStat(pokemon2Details.baseStats.attack, pokemon2Level),
        defense: calculateStat(pokemon2Details.baseStats.defense, pokemon2Level),
        special_attack: calculateStat(pokemon2Details.baseStats.special_attack, pokemon2Level),
        special_defense: calculateStat(pokemon2Details.baseStats.special_defense, pokemon2Level),
        speed: calculateStat(pokemon2Details.baseStats.speed, pokemon2Level)
      };
      
      // Update HP and stats
      setPokemon1HP(pokemon1Stats.hp);
      setPokemon2HP(pokemon2Stats.hp);
      
      // Update Pokémon details with new stats
      setPokemon1Details(prev => ({ ...prev, stats: pokemon1Stats }));
      setPokemon2Details(prev => ({ ...prev, stats: pokemon2Stats }));
      
      // Re-fetch moves appropriate for the new levels
      fetchMoveDetails(pokemon1Details, pokemon2Details);
    }
  };
  
  const startBattle = () => {
    setBattleStarted(true);
    setBattleInProgress(true);
    setBattleLog(prev => [...prev, `Battle begins! Lv.${pokemon1Level} ${pokemon1Details.name} vs Lv.${pokemon2Level} ${pokemon2Details.name}`]);
    
    // Determine who goes first based on speed
    if (pokemon1Details.stats.speed >= pokemon2Details.stats.speed) {
      setCurrentTurn(1);
      setBattleLog(prev => [...prev, `${pokemon1Details.name} moves first due to higher speed!`]);
    } else {
      setCurrentTurn(2);
      setBattleLog(prev => [...prev, `${pokemon2Details.name} moves first due to higher speed!`]);
    }
  };

  const executeMove = (moveIndex) => {
    if (battleEnded) return;
    
    const attackingPokemon = currentTurn === 1 ? pokemon1Details : pokemon2Details;
    const defendingPokemon = currentTurn === 1 ? pokemon2Details : pokemon1Details;
    const attackerLevel = currentTurn === 1 ? pokemon1Level : pokemon2Level;
    const movesArray = currentTurn === 1 ? pokemon1Moves : pokemon2Moves;
    
    // Check if moves array is populated
    if (!movesArray || movesArray.length === 0 || moveIndex >= movesArray.length) {
      setBattleLog(prev => [...prev, `No move selected or moves not loaded yet!`]);
      return;
    }
    
    const selectedMove = movesArray[moveIndex];
    
    // Check if the move hits (based on accuracy)
    const accuracyCheck = Math.random() * 100;
    if (accuracyCheck > selectedMove.accuracy) {
      setBattleLog(prev => [
        ...prev, 
        `${attackingPokemon.name} used ${selectedMove.name}!`,
        `But it missed!`
      ]);
      setCurrentTurn(currentTurn === 1 ? 2 : 1);
      return;
    }
    
    // Calculate damage based on move type
    let damage = 0;
    let moveEffectText = null;
    
    if (selectedMove.damageClass === 'status') {
      // Status moves don't deal direct damage
      setBattleLog(prev => [
        ...prev, 
        `${attackingPokemon.name} used ${selectedMove.name}!`,
        selectedMove.effect.replace('$effect_chance', selectedMove.effectChance || 0)
      ]);
      setCurrentTurn(currentTurn === 1 ? 2 : 1);
      return;
    }
    
    // Determine which attack and defense stats to use
    const attackStat = selectedMove.damageClass === 'special' ? 
      attackingPokemon.stats.special_attack : 
      attackingPokemon.stats.attack;
    
    const defenseStat = selectedMove.damageClass === 'special' ? 
      defendingPokemon.stats.special_defense : 
      defendingPokemon.stats.defense;
    
    // Get move's base power
    const basePower = selectedMove.power;
    
    // Calculate type effectiveness
    const effectiveness = calculateTypeEffectiveness(selectedMove.type, defendingPokemon.types);
    
    // Same-Type Attack Bonus (STAB)
    const stab = attackingPokemon.types.includes(selectedMove.type) ? 1.5 : 1;
    
    // Random factor (0.85 to 1.0)
    const randomFactor = 0.85 + Math.random() * 0.15;
    
    // Critical hit chance (1/24 for regular moves)
    const isCritical = Math.random() < 1/24;
    const criticalMultiplier = isCritical ? 1.5 : 1;
    
    // Pokemon damage formula
    damage = Math.floor((
      ((2 * attackerLevel / 5 + 2) * basePower * attackStat / defenseStat / 50 + 2) 
      * effectiveness 
      * stab 
      * randomFactor 
      * criticalMultiplier
    ));
    
    // Ensure minimum damage
    damage = Math.max(1, damage);
    
    // Apply damage
    if (currentTurn === 1) {
      const newHP = Math.max(0, pokemon2HP - damage);
      setPokemon2HP(newHP);
      
      // Add battle log
      const battleMessages = [
        `${attackingPokemon.name} used ${selectedMove.name}!`
      ];
      
      if (isCritical) battleMessages.push('A critical hit!');
      if (effectiveness > 1) battleMessages.push("It's super effective!");
      else if (effectiveness < 1 && effectiveness > 0) battleMessages.push("It's not very effective...");
      else if (effectiveness === 0) battleMessages.push(`It doesn't affect ${defendingPokemon.name}...`);
      
      if (effectiveness > 0) battleMessages.push(`${defendingPokemon.name} took ${damage} damage!`);
      
      setBattleLog(prev => [...prev, ...battleMessages]);
      
      // Check if battle ended
      if (newHP <= 0) {
        endBattle(pokemon1Details);
      } else {
        // Switch turn
        setCurrentTurn(2);
      }
    } else {
      const newHP = Math.max(0, pokemon1HP - damage);
      setPokemon1HP(newHP);
      
      // Add battle log
      const battleMessages = [
        `${attackingPokemon.name} used ${selectedMove.name}!`
      ];
      
      if (isCritical) battleMessages.push('A critical hit!');
      if (effectiveness > 1) battleMessages.push("It's super effective!");
      else if (effectiveness < 1 && effectiveness > 0) battleMessages.push("It's not very effective...");
      else if (effectiveness === 0) battleMessages.push(`It doesn't affect ${defendingPokemon.name}...`);
      
      if (effectiveness > 0) battleMessages.push(`${defendingPokemon.name} took ${damage} damage!`);
      
      setBattleLog(prev => [...prev, ...battleMessages]);
      
      // Check if battle ended
      if (newHP <= 0) {
        endBattle(pokemon2Details);
      } else {
        // Switch turn
        setCurrentTurn(1);
      }
    }
  };

  const calculateTypeEffectiveness = (attackType, defenseTypes) => {
    // Simplified type effectiveness chart
    const typeChart = {
      normal: { rock: 0.5, ghost: 0, steel: 0.5 },
      fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
      water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
      electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
      grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
      ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
      fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
      poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
      ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
      flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
      psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
      bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
      rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
      ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
      dragon: { dragon: 2, steel: 0.5, fairy: 0 },
      dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
      steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
      fairy: { fighting: 2, poison: 0.5, bug: 0.5, dragon: 2, dark: 2, steel: 0.5 }
    };
    
    // Default effectiveness is 1
    if (!typeChart[attackType]) return 1;
    
    // Calculate effectiveness against each defending type
    let finalEffectiveness = 1;
    for (const defenseType of defenseTypes) {
      const effectiveness = typeChart[attackType][defenseType] || 1;
      finalEffectiveness *= effectiveness;
    }
    
    return finalEffectiveness;
  };

  const endBattle = (winner) => {
    setBattleInProgress(false);
    setBattleEnded(true);
    setWinner(winner);
    setBattleLog(prev => [...prev, `${winner.name} wins the battle!`]);
  };

  const resetBattle = () => {
    setShowLevelSelect(true);
    setBattleStarted(false);
    setBattleInProgress(false);
    setBattleEnded(false);
    setWinner(null);
    
    // Reset moves and HP after re-selecting levels
    if (pokemon1Details && pokemon2Details) {
      updatePokemonStats();
      setBattleLog([`A battle between ${pokemon1Details.name} and ${pokemon2Details.name} is about to begin!`]);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 3 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Preparing battle...</Typography>
      </Box>
    );
  }
  
  // Level selection screen
  if (showLevelSelect && pokemon1Details && pokemon2Details) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" fontFamily="'Press Start 2P', cursive" sx={{ mb: 3, textAlign: 'center' }}>
          Set Pokémon Levels
        </Typography>
        
        <Grid container spacing={4}>
          {/* Pokémon 1 */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box 
                  component="img" 
                  src={pokemon1Details.animatedImage || pokemon1Details.image} 
                  alt={pokemon1Details.name}
                  sx={{ width: 80, height: 80, mr: 2 }}
                />
                <Box>
                  <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                    {pokemon1Details.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {pokemon1Details.types.map(type => (
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
                </Box>
              </Box>
              
              <Typography gutterBottom>Level: {pokemon1Level}</Typography>
              <Slider
                value={pokemon1Level}
                onChange={(e, newValue) => setPokemon1Level(newValue)}
                min={5}
                max={100}
                valueLabelDisplay="auto"
                aria-labelledby="pokemon1-level-slider"
                sx={{ 
                  color: theme.palette.pokemonTypes[pokemon1Details.types[0]] || 'primary.main',
                  '& .MuiSlider-valueLabel': {
                    backgroundColor: theme.palette.pokemonTypes[pokemon1Details.types[0]] || 'primary.main'
                  }
                }}
              />
              
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Base Stats:</Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2">HP: {pokemon1Details.baseStats.hp}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Speed: {pokemon1Details.baseStats.speed}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Attack: {pokemon1Details.baseStats.attack}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Defense: {pokemon1Details.baseStats.defense}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* Pokémon 2 */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box 
                  component="img" 
                  src={pokemon2Details.animatedImage || pokemon2Details.image} 
                  alt={pokemon2Details.name}
                  sx={{ width: 80, height: 80, mr: 2 }}
                />
                <Box>
                  <Typography variant="h6" sx={{ textTransform: 'capitalize' }}>
                    {pokemon2Details.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {pokemon2Details.types.map(type => (
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
                </Box>
              </Box>
              
              <Typography gutterBottom>Level: {pokemon2Level}</Typography>
              <Slider
                value={pokemon2Level}
                onChange={(e, newValue) => setPokemon2Level(newValue)}
                min={5}
                max={100}
                valueLabelDisplay="auto"
                aria-labelledby="pokemon2-level-slider"
                sx={{ 
                  color: theme.palette.pokemonTypes[pokemon2Details.types[0]] || 'primary.main',
                  '& .MuiSlider-valueLabel': {
                    backgroundColor: theme.palette.pokemonTypes[pokemon2Details.types[0]] || 'primary.main'
                  }
                }}
              />
              
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Base Stats:</Typography>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Typography variant="body2">HP: {pokemon2Details.baseStats.hp}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Speed: {pokemon2Details.baseStats.speed}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Attack: {pokemon2Details.baseStats.attack}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2">Defense: {pokemon2Details.baseStats.defense}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
        
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            onClick={confirmSetup}
            startIcon={<SportsKabaddiIcon />}
            sx={{ 
              fontFamily: "'Press Start 2P', cursive", 
              fontSize: '0.8rem',
              py: 1.5,
              px: 4 
            }}
          >
            Start Battle
          </Button>
        </Box>
      </Box>
    );
  }

  const calculateHPPercentage = (current, max) => (current / max) * 100;

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        mb: 3,
        backgroundImage: 'linear-gradient(to right, #FF0000, #FFFFFF, #3B4CCA)',
        p: 2,
        borderRadius: 2,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png)`,
          backgroundRepeat: 'repeat',
          opacity: 0.1,
          zIndex: 0
        }
      }}>
        <Typography variant="h4" 
          component="h2" 
          fontFamily="'Press Start 2P', cursive" 
          sx={{ 
            color: 'white', 
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
            zIndex: 1,
            fontSize: { xs: '1rem', sm: '1.5rem' }
          }}
        >
          Pokémon Battle
        </Typography>
        <Button 
          variant="contained" 
          color="error" 
          startIcon={<CloseIcon />}
          onClick={onClose}
          sx={{ zIndex: 1 }}
        >
          Exit
        </Button>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          {/* Battle Arena */}
          <Paper sx={{ 
            p: 3, 
            backgroundImage: 'linear-gradient(to bottom, #A8E063, #56AB2F)',
            borderRadius: 2,
            position: 'relative',
            mb: 2,
            height: '300px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 3,
            '&::before': {
              content: '""',
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '100%',
              height: '40%',
              backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.2), transparent)',
              zIndex: 1
            }
          }}>
            {/* Pokémon 1 (left side) */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', zIndex: 2 }}>
              <Box sx={{ textAlign: 'left' }}>
                <Box sx={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.7)', 
                  p: 1, 
                  borderRadius: 1,
                  width: '180px',
                  mb: 1
                }}>
                  <Typography sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                    {pokemon1Details.name} Lv.{pokemon1Level}
                  </Typography>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={calculateHPPercentage(pokemon1HP, pokemon1Details.stats.hp)} 
                      sx={{ 
                        height: 10, 
                        borderRadius: 5,
                        backgroundColor: '#ffcccc',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: pokemon1HP > pokemon1Details.stats.hp * 0.5 ? '#4CAF50' : 
                                          pokemon1HP > pokemon1Details.stats.hp * 0.2 ? '#FFC107' : '#FF5252'
                        }
                      }} 
                    />
                    <Typography variant="caption" sx={{ display: 'block', textAlign: 'right' }}>
                      {pokemon1HP}/{pokemon1Details.stats.hp} HP
                    </Typography>
                  </Box>
                </Box>
                <Box 
                  component="img"
                  src={pokemon1Details.animatedImage || pokemon1Details.image}
                  alt={pokemon1Details.name}
                  sx={{ 
                    height: '120px',
                    filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
                    transform: 'scaleX(-1)', // face right
                    animation: battleInProgress && currentTurn === 1 ? 'bounce 0.5s infinite alternate' : 'none',
                    '@keyframes bounce': {
                      '0%': { transform: 'scaleX(-1) translateY(0)' },
                      '100%': { transform: 'scaleX(-1) translateY(-10px)' }
                    }
                  }}
                />
              </Box>

              {/* Pokémon 2 (right side) */}
              <Box sx={{ textAlign: 'right' }}>
                <Box sx={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.7)', 
                  p: 1, 
                  borderRadius: 1,
                  width: '180px',
                  mb: 1
                }}>
                  <Typography sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                    {pokemon2Details.name} Lv.{pokemon2Level}
                  </Typography>
                  <Box sx={{ width: '100%', mr: 1 }}>
                    <LinearProgress 
                      variant="determinate" 
                      value={calculateHPPercentage(pokemon2HP, pokemon2Details.stats.hp)} 
                      sx={{ 
                        height: 10, 
                        borderRadius: 5,
                        backgroundColor: '#ffcccc',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: pokemon2HP > pokemon2Details.stats.hp * 0.5 ? '#4CAF50' : 
                                          pokemon2HP > pokemon2Details.stats.hp * 0.2 ? '#FFC107' : '#FF5252'
                        }
                      }} 
                    />
                    <Typography variant="caption" sx={{ display: 'block', textAlign: 'right' }}>
                      {pokemon2HP}/{pokemon2Details.stats.hp} HP
                    </Typography>
                  </Box>
                </Box>
                <Box 
                  component="img"
                  src={pokemon2Details.animatedImage || pokemon2Details.image}
                  alt={pokemon2Details.name}
                  sx={{ 
                    height: '120px',
                    filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))',
                    animation: battleInProgress && currentTurn === 2 ? 'bounce 0.5s infinite alternate' : 'none',
                    '@keyframes bounce': {
                      '0%': { transform: 'translateY(0)' },
                      '100%': { transform: 'translateY(-10px)' }
                    }
                  }}
                />
              </Box>
            </Box>

            {/* Battle text */}
            <Box sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.9)', 
              p: 2, 
              borderRadius: 2,
              zIndex: 2,
              fontFamily: "'Press Start 2P', cursive",
              fontSize: '0.8rem'
            }}>
              {battleLog.length > 0 && (
                <Typography fontFamily="'Press Start 2P', cursive" fontSize="0.8rem">
                  {battleLog[battleLog.length - 1]}
                </Typography>
              )}
            </Box>
          </Paper>

          {/* Battle controls */}
          <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 3 }}>
            {!battleStarted ? (
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth 
                onClick={startBattle}
                startIcon={<SportsKabaddiIcon />}
                sx={{ 
                  py: 1.5, 
                  fontFamily: "'Press Start 2P', cursive",
                  fontSize: '0.8rem'
                }}
              >
                Start Battle!
              </Button>
            ) : battleEnded ? (
              <Box sx={{ textAlign: 'center' }}>
                <Typography 
                  variant="h5" 
                  fontFamily="'Press Start 2P', cursive" 
                  sx={{ mb: 2, color: theme.palette.pokemonTypes[winner.types[0]] || 'primary.main' }}
                >
                  {winner.name} wins!
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={resetBattle}
                  sx={{ mr: 1 }}
                >
                  Rematch
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={onClose}
                >
                  Exit
                </Button>
              </Box>
            ) : (
              <Box>
                <Typography fontFamily="'Press Start 2P', cursive" sx={{ mb: 2 }}>
                  {currentTurn === 1 ? pokemon1Details.name : pokemon2Details.name}'s turn
                </Typography>
                <Grid container spacing={1}>
                  {(currentTurn === 1 ? pokemon1Moves : pokemon2Moves).map((move, index) => (
                    <Grid item xs={6} key={index}>
                      <Tooltip title={
                        <Box>
                          <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                            Type: {move.type}
                          </Typography>
                          <Typography variant="body2">
                            Power: {move.power || 'N/A'} | Accuracy: {move.accuracy || 'N/A'}
                          </Typography>
                          <Typography variant="body2">
                            {move.damageClass === 'physical' ? '💪 Physical' : 
                             move.damageClass === 'special' ? '✨ Special' : '🔄 Status'}
                          </Typography>
                          {move.effect && (
                            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                              {move.effect}
                            </Typography>
                          )}
                        </Box>
                      }>
                        <Button 
                          variant="contained" 
                          fullWidth
                          onClick={() => executeMove(index)}
                          sx={{ 
                            textTransform: 'capitalize',
                            backgroundColor: theme.palette.pokemonTypes[move.type] || 'primary.main',
                            color: 'white',
                            '&:hover': {
                              backgroundColor: theme.palette.pokemonTypes[move.type] || 'primary.dark',
                              filter: 'brightness(90%)'
                            }
                          }}
                        >
                          {move.name.replace('-', ' ')}
                        </Button>
                      </Tooltip>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          {/* Battle log */}
          <Paper sx={{ 
            p: 2, 
            borderRadius: 2, 
            maxHeight: '400px', 
            overflow: 'auto',
            boxShadow: 3,
            backgroundColor: '#f5f5f5'
          }}>
            <Typography variant="h6" gutterBottom>Battle Log</Typography>
            <List dense>
              {battleLog.map((log, index) => (
                <ListItem key={index} divider={index !== battleLog.length - 1}>
                  <ListItemText 
                    primary={log}
                    primaryTypographyProps={{
                      style: {
                        fontSize: '0.85rem',
                        fontFamily: index === battleLog.length - 1 ? "'Press Start 2P', cursive" : 'inherit'
                      }
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BattleSimulator;
