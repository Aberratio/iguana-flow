import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, Clock, Bookmark, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useFigureProgress } from '@/hooks/useFigureProgress';
import { useNavigate } from 'react-router-dom';
import { useDictionary } from '@/contexts/DictionaryContext';

const MyJourney = () => {
  const {
    figureProgress,
    loading,
    getFiguresByStatus
  } = useFigureProgress();
  const navigate = useNavigate();
  const { getDifficultyLabel } = useDictionary();
  const [activeStatus, setActiveStatus] = useState('all');
  const statusConfig = {
    completed: {
      label: 'Ukończone',
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10'
    },
    for_later: {
      label: 'Na później',
      icon: Bookmark,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10'
    },
    failed: {
      label: 'Nieudane',
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-400/10'
    },
    not_tried: {
      label: 'Niewykonane',
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10'
    }
  };
  const getFilteredFigures = () => {
    if (activeStatus === 'all') return figureProgress;
    return getFiguresByStatus(activeStatus);
  };
  const filteredFigures = getFilteredFigures();
  if (loading) {
    return <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center text-muted-foreground">Ładowanie Twojej podróży...</div>
      </div>;
  }
  return <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Moja podróż przez figury</h1>
          <p className="text-muted-foreground">Śledź swoje postępy we wszystkich figurach powietrznych</p>
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">Filtruj według statusu</h2>
          <div className="flex flex-wrap gap-3">
            <Button 
              variant={activeStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setActiveStatus('all')} 
              className={`transition-all border-white/20 ${
                activeStatus === 'all' 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600' 
                  : 'text-white hover:text-white hover:bg-white/10 hover:border-white/30'
              }`}
            >
              Wszystkie
              <Badge variant="secondary" className="ml-2 bg-white/20 text-white text-xs">
                {figureProgress.length}
              </Badge>
            </Button>
            
            {Object.entries(statusConfig).map(([status, config]) => {
              const Icon = config.icon;
              const count = getFiguresByStatus(status).length;
              return (
                <Button 
                  key={status} 
                  variant={activeStatus === status ? 'default' : 'outline'}
                  onClick={() => setActiveStatus(status)} 
                  className={`transition-all border-white/20 ${
                    activeStatus === status 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600' 
                      : 'text-white hover:text-white hover:bg-white/10 hover:border-white/30'
                  }`}
                >
                  <Icon className={`w-4 h-4 mr-2 ${activeStatus === status ? 'text-white' : config.color}`} />
                  <span className="hidden sm:inline">{config.label}</span>
                  <span className="sm:hidden">{config.label.split(' ')[0]}</span>
                  <Badge variant="secondary" className="ml-2 bg-white/20 text-white text-xs">
                    {count}
                  </Badge>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Figures Grid */}
        {filteredFigures.length === 0 ? <Card className="glass-effect border-white/10">
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                <p>Nie znaleziono figur dla tego statusu.</p>
                <p className="text-sm mt-2">
                  <Link to="/library" className="text-purple-400 hover:text-purple-300">
                    Przejdź do biblioteki, aby rozpocząć swoją podróż
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card> : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredFigures.map(figure => {
          const statusInfo = statusConfig[figure.status as keyof typeof statusConfig];
          const Icon = statusInfo?.icon || Clock;
          return <Card key={figure.id} className="glass-effect border-white/10 cursor-pointer hover:transform hover:scale-105 transition-all duration-300 group" onClick={() => {
            navigate(`/exercise/${figure.id}`, { state: { from: '/my-journey' } });
          }}>
                  <CardContent className="p-0">
                    <div className="relative">
                      <div className="aspect-square rounded-t-lg overflow-hidden">
                        {figure.image_url ? <img src={figure.image_url} alt={figure.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" /> : <div className="w-full h-full bg-white/5 flex items-center justify-center">
                            <span className="text-4xl">🤸</span>
                          </div>}
                      </div>
                      
                      {/* Status Badge */}
                      <div className={`absolute top-2 right-2 p-2 rounded-full ${statusInfo?.bgColor || 'bg-gray-400/10'}`}>
                        <Icon className={`w-4 h-4 ${statusInfo?.color || 'text-gray-400'}`} />
                      </div>
                    </div>
                    
                    <div className="p-4">
                      <h3 className="text-white font-semibold mb-1 line-clamp-1">{figure.name}</h3>
                      {figure.difficulty_level && <Badge variant="outline" className="text-xs border-white/20 text-muted-foreground">
                          {getDifficultyLabel(figure.difficulty_level)}
                        </Badge>}
                      {figure.category && <div className="text-xs text-muted-foreground mt-1">{figure.category}</div>}
                    </div>
                  </CardContent>
                </Card>;
        })}
          </div>}
      </div>
    </div>;
};
export default MyJourney;