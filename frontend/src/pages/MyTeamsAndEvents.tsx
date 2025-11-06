// pages/MyTeamsAndEvents.tsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Users,
  Calendar,
  Clock,
  User,
  Globe,
  Lock,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Briefcase,
  UserPlus,
  Mail,
  CheckCircle2,
  XCircle,
  Sparkles,
  TrendingUp,
  CalendarDays
} from 'lucide-react';
import { RootState } from '../store/store';
import { selectUser } from '../store/slices/authSlice';

interface TeamData {
  _id: string;
  name: string;
  description: string;
  members: { _id: string; name: string; email: string }[];
  creator: { _id: string; name: string; email: string };
  linkedEventId?: {
    _id: string;
    title: string;
    description: string;
    start: string;
    end: string;
    type: string;
    isPublic: boolean;
  };
  invites?: Array<{
    email: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
  }>;
  createdAt: string;
}

interface EventData {
  _id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  type: 'meeting' | 'workshop' | 'deadline' | 'social';
  isPublic: boolean;
  creator: { _id: string; name: string; email: string };
  teams?: TeamData[];
}

const MyTeamsAndEvents: React.FC = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => selectUser(state));
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [userCreatedEvents, setUserCreatedEvents] = useState<EventData[]>([]);
  const [linkedEvents, setLinkedEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'teams' | 'events'>('teams');

  const API_BASE = '/api';

  useEffect(() => {
    const fetchData = async () => {
      if (!user?._id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await axios.get(`${API_BASE}/teams/my-teams-events`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });

        if (res.data.success) {
          setTeams(res.data.data.teams || []);
          setUserCreatedEvents(res.data.data.userCreatedEvents || []);
          setLinkedEvents(res.data.data.linkedEvents || []);
        } else {
          setError(res.data.error || 'Erreur lors du chargement des données');
        }
      } catch (err: any) {
        console.error('Erreur:', err);
        setError(err.response?.data?.error || 'Erreur lors du chargement des données');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?._id]);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      meeting: 'bg-blue-100 text-blue-800 border-blue-300',
      workshop: 'bg-purple-100 text-purple-800 border-purple-300',
      deadline: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      social: 'bg-green-100 text-green-800 border-green-300'
    };
    return colors[type] || colors.meeting;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      meeting: 'Réunion',
      workshop: 'Travail',
      deadline: 'Échéance',
      social: 'Personnel'
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const getInviteStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Mail className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <Loader2 className="h-12 w-12 text-purple-600 animate-spin mb-4" />
        <p className="text-gray-600 text-lg">Chargement de vos équipes et événements...</p>
      </div>
    );
  }

  if (error && teams.length === 0 && userCreatedEvents.length === 0 && linkedEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const allEvents = [...userCreatedEvents, ...linkedEvents];
  const uniqueEvents = allEvents.filter((event, index, self) =>
    index === self.findIndex(e => e._id === event._id)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Mes Équipes & Événements</h1>
              <p className="text-gray-600 mt-1">Gérez vos équipes et événements en un seul endroit</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Mes Équipes</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{teams.length}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Événements Créés</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{userCreatedEvents.length}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CalendarDays className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Événements Liés</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{linkedEvents.length}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-lg flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('teams')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'teams'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>Mes Équipes ({teams.length})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'events'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>Mes Événements ({uniqueEvents.length})</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Teams Tab */}
        {activeTab === 'teams' && (
          <div>
            {teams.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-md border border-gray-200">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune équipe</h3>
                <p className="text-gray-600 mb-6">Vous n'êtes membre d'aucune équipe pour le moment.</p>
                <button
                  onClick={() => navigate('/events')}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Voir les événements
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team) => (
                  <div
                    key={team._id}
                    className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => team.linkedEventId && navigate(`/events/${team.linkedEventId._id}`)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{team.name}</h3>
                        {team.description && (
                          <p className="text-gray-600 text-sm line-clamp-2 mb-3">{team.description}</p>
                        )}
                      </div>
                      <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Users className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>

                    {/* Event Link */}
                    {team.linkedEventId && (
                      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-900">Événement lié</span>
                        </div>
                        <p className="text-sm text-blue-800 font-medium">{team.linkedEventId.title}</p>
                        <p className="text-xs text-blue-600 mt-1">
                          {formatDate(team.linkedEventId.start)} à {formatTime(team.linkedEventId.start)}
                        </p>
                      </div>
                    )}

                    {/* Members */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Membres ({team.members?.length || 0})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {team.members?.slice(0, 3).map((member) => (
                          <div
                            key={member._id}
                            className="flex items-center px-2 py-1 bg-gray-100 rounded-md text-sm"
                          >
                            <div className="h-6 w-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-xs font-bold mr-2">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-gray-700">{member.name}</span>
                          </div>
                        ))}
                        {team.members && team.members.length > 3 && (
                          <div className="flex items-center px-2 py-1 bg-gray-100 rounded-md text-sm text-gray-600">
                            +{team.members.length - 3} autres
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Creator */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-600">
                          Créé par <span className="font-semibold">{team.creator.name}</span>
                        </span>
                      </div>
                    </div>

                    {/* Invites */}
                    {team.invites && team.invites.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                          Invitations ({team.invites.length})
                        </p>
                        <div className="space-y-1">
                          {team.invites.slice(0, 3).map((invite, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                              {getInviteStatusIcon(invite.status)}
                              <span className="text-gray-600">{invite.email}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div>
            {uniqueEvents.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-md border border-gray-200">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun événement</h3>
                <p className="text-gray-600 mb-6">Vous n'avez créé ou participé à aucun événement.</p>
                <button
                  onClick={() => navigate('/events')}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Créer un événement
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* User Created Events */}
                {userCreatedEvents.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-purple-600" />
                      Événements que j'ai créés ({userCreatedEvents.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {userCreatedEvents.map((event) => (
                        <div
                          key={event._id}
                          className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => navigate(`/events/${event._id}`)}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getTypeColor(event.type)}`}>
                                  {getTypeLabel(event.type)}
                                </span>
                                {event.isPublic ? (
                                  <Globe className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <Lock className="h-4 w-4 text-gray-400" />
                                )}
                              </div>
                              <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                              {event.description && (
                                <p className="text-gray-600 text-sm line-clamp-2 mb-4">{event.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(event.start)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>{formatTime(event.start)} - {formatTime(event.end)}</span>
                            </div>
                          </div>

                          {event.teams && event.teams.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-600">
                                  {event.teams.length} équipe{event.teams.length > 1 ? 's' : ''} associée{event.teams.length > 1 ? 's' : ''}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="mt-4 flex items-center justify-end">
                            <ArrowRight className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Linked Events */}
                {linkedEvents.length > 0 && (
                  <div className={userCreatedEvents.length > 0 ? 'mt-8' : ''}>
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-blue-600" />
                      Événements liés à mes équipes ({linkedEvents.length})
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {linkedEvents.map((event) => (
                        <div
                          key={event._id}
                          className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => navigate(`/events/${event._id}`)}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getTypeColor(event.type)}`}>
                                  {getTypeLabel(event.type)}
                                </span>
                                {event.isPublic ? (
                                  <Globe className="h-4 w-4 text-gray-400" />
                                ) : (
                                  <Lock className="h-4 w-4 text-gray-400" />
                                )}
                              </div>
                              <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                              {event.description && (
                                <p className="text-gray-600 text-sm line-clamp-2 mb-4">{event.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(event.start)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>{formatTime(event.start)} - {formatTime(event.end)}</span>
                            </div>
                          </div>

                          {event.teams && event.teams.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="flex items-center gap-2 mb-2">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-semibold text-gray-700">
                                  {event.teams.length} équipe{event.teams.length > 1 ? 's' : ''} associée{event.teams.length > 1 ? 's' : ''}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {event.teams.slice(0, 3).map((team) => (
                                  <span
                                    key={team._id}
                                    className="px-2 py-1 bg-purple-100 text-purple-800 rounded-md text-xs font-medium"
                                  >
                                    {team.name}
                                  </span>
                                ))}
                                {event.teams.length > 3 && (
                                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs">
                                    +{event.teams.length - 3} autres
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="mt-4 flex items-center justify-end">
                            <ArrowRight className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTeamsAndEvents;

