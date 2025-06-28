import React, { useEffect, useState } from 'react';
import { Text, Button, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Tor from 'react-native-tor';

// Cria a instância do Tor uma única vez fora do componente
const tor = Tor({
  stopDaemonOnBackground: false, // Mudança importante aqui
});

export default function App() {
  const [torReady, setTorReady] = useState(false);
  const [response, setResponse] = useState('');
  const [socksPort, setSocksPort] = useState(0);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    const initializeTor = async () => {
      if (isStarting) return; // Previne múltiplas inicializações
      
      setIsStarting(true);
      
      try {
        console.log('Verificando status do Tor...');
        
        // Primeiro, tenta parar qualquer instância existente
        try {
          await tor.stopDaemon();
          console.log('Daemon anterior parado com sucesso');
          // Aguarda um pouco para garantir que o daemon parou completamente
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (stopError) {
          console.log('Nenhum daemon anterior para parar ou erro ao parar:', stopError.message);
        }

        console.log('Iniciando novo daemon Tor...');
        const port = await tor.startIfNotStarted();
        console.log('Tor iniciado na porta SOCKS:', port);
        setSocksPort(port);
        setTorReady(true);
        
      } catch (error) {
        console.error('Erro ao inicializar o Tor:', error);
        Alert.alert('Erro', 'Não foi possível iniciar o Tor: ' + error.message);
      } finally {
        setIsStarting(false);
      }
    };

    initializeTor();

    // Cleanup quando o componente for desmontado
    return () => {
      tor.stopDaemon().catch(console.error);
    };
  }, []);

  const fazerRequisicao = async () => {
    if (!torReady) {
      Alert.alert('Aviso', 'Tor ainda não está pronto');
      return;
    }

    try {
      setResponse('Fazendo requisição...');
      
      const res = await tor.get('http://aqqxvfk7lgweiidgasz4doevgqdssrghww26myiipfpuijgdyymh46ad.onion/api/1.json', {
        'Authorization': 'sometoken',
      });
      
      console.log('Resposta recebida:', res);
      setResponse(JSON.stringify(res, null, 2));
      
    } catch (error) {
      console.error('Erro na requisição:', error);
      setResponse(`Erro ao acessar .onion: ${error.message}`);
    }
  };

  const reiniciarTor = async () => {
    setTorReady(false);
    setIsStarting(true);
    
    try {
      await tor.stopDaemon();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const port = await tor.startIfNotStarted();
      setSocksPort(port);
      setTorReady(true);
      Alert.alert('Sucesso', 'Tor reiniciado com sucesso');
      
    } catch (error) {
      console.error('Erro ao reiniciar Tor:', error);
      Alert.alert('Erro', 'Erro ao reiniciar Tor: ' + error.message);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <Text style={{ marginBottom: 20, fontSize: 16, fontWeight: 'bold' }}>
        Status do Tor: {
          isStarting ? 'Iniciando...' : 
          torReady ? `Pronto (porta ${socksPort})` : 
          'Parado'
        }
      </Text>

      {torReady && (
        <TouchableOpacity 
          onPress={fazerRequisicao}
          style={{ 
            backgroundColor: '#007AFF', 
            padding: 15, 
            borderRadius: 8, 
            marginBottom: 10 
          }}
        >
          <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
            Fazer Requisição .onion
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        onPress={reiniciarTor}
        style={{ 
          backgroundColor: '#FF3B30', 
          padding: 15, 
          borderRadius: 8, 
          marginBottom: 20 
        }}
        disabled={isStarting}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>
          {isStarting ? 'Reiniciando...' : 'Reiniciar Tor'}
        </Text>
      </TouchableOpacity>

      <Text style={{ marginTop: 20, fontSize: 16, fontWeight: 'bold' }}>
        Resposta:
      </Text>
      <ScrollView 
        style={{ 
          backgroundColor: '#f5f5f5', 
          padding: 10, 
          borderRadius: 8, 
          maxHeight: 300,
          marginTop: 10 
        }}
      >
        <Text selectable style={{ fontFamily: 'monospace' }}>
          {response || 'Nenhuma resposta ainda...'}
        </Text>
      </ScrollView>
    </ScrollView>
  );
}