// pages/TeamInviteAccept.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Users, 
  Calendar
} from 'lucide-react';
import { RootState } from '../store/store';

const TeamInviteAccept: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [teamInfo, setTeamInfo] = useState<any>(null);

  const API_BASE = 'http://localhost:3000/api';

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    if (!user) {
      setError('Vous devez être connecté pour accepter une invitation.');
      setLoading(false);
      return;
    }

    // Tenter d'accepter l'invitation automatiquement
    handleAcceptInvite();
  }, [token, user]);

  const handleAcceptInvite = async () => {
    if (!token || !user?._id) {
      setError('Token d\'invitation invalide ou utilisateur non connecté.');
      setLoading(false);
      return;
    }

    setAccepting(true);
    setError(null);

    try {
      const res = await axios.post(
        `${API_BASE}/teams/accept`,
        { token },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (res.data.success) {
        setTeamInfo(res.data.data?.team);
        setSuccess(true);
        
        // Rediriger vers l'événement après 3 secondes
        setTimeout(() => {
          if (res.data.data?.team?.linkedEventId) {
            navigate(`/events/${res.data.data.team.linkedEventId}`);
          } else {
            navigate('/events');
          }
        }, 3000);
      } else {
        setError(res.data.error || 'Erreur lors de l\'acceptation de l\'invitation');
      }
    } catch (err: any) {
      console.error('Erreur acceptation invitation:', err);
      setError(
        err.response?.data?.error || 
        err.response?.data?.message || 
        'Erreur lors de l\'acceptation de l\'invitation'
      );
    } finally {
      setLoading(false);
      setAccepting(false);
    }
  };

  if (loading || accepting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <Loader2 className="h-16 w-16 text-purple-600 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Traitement de l'invitation</h2>
          <p className="text-gray-600">Veuillez patienter...</p>
        </div>
      </div>
    );
  }

  if (error && !success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Se connecter
              </button>
              <button
                onClick={() => navigate('/events')}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Retour au calendrier
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Success Header */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 py-6">
            <div className="flex items-center justify-center mb-4">
              <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center shadow-lg">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white text-center mb-2">
              Invitation acceptée !
            </h2>
          </div>

          {/* Content */}
          <div className="p-8">
            {teamInfo && (
              <div className="space-y-4 mb-6">
                <div className="flex items-center text-gray-700">
                  <Users className="h-5 w-5 text-purple-500 mr-3" />
                  <div>
                    <p className="text-sm text-gray-500">Équipe</p>
                    <p className="font-semibold">{teamInfo.name}</p>
                  </div>
                </div>
                {teamInfo.description && (
                  <div className="text-gray-600 text-sm">
                    <p className="text-gray-500 mb-1">Description</p>
                    <p>{teamInfo.description}</p>
                  </div>
                )}
                {teamInfo.linkedEventId && (
                  <div className="flex items-center text-gray-700">
                    <Calendar className="h-5 w-5 text-blue-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">Événement lié</p>
                      <p className="font-semibold">{teamInfo.linkedEventId.title || 'Événement'}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Vous avez rejoint l'équipe avec succès !
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Redirection automatique dans quelques secondes...
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              {teamInfo?.linkedEventId && (
                <button
                  onClick={() => navigate(`/events/${teamInfo.linkedEventId._id || teamInfo.linkedEventId}`)}
                  className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Voir l'événement
                </button>
              )}
              <button
                onClick={() => navigate('/events')}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Retour au calendrier
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default TeamInviteAccept;

