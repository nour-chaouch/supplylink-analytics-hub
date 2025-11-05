// pages/EventInterfacePage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { 
  Calendar,
  Clock,
  Users,
  User,
  Edit,
  Trash2,
  X,
  Plus,
  AlertTriangle,
  Shield,
  Globe,
  Lock,
  Tag,
  FileText,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Mail,
  XCircle,
  PencilIcon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { RootState } from '../store/store';
import { selectUser } from '../store/slices/authSlice';

interface EventData {
  _id: string;
  title: string;
  description: string;
  start: string;
  end: string;
  type: 'meeting' | 'workshop' | 'deadline' | 'social';
  isPublic: boolean;
  color: string;
  teamIds?: string[];
  creator: { _id: string; name: string; email: string };
  teams?: TeamData[];
}

interface TeamData {
  _id: string;
  name: string;
  description: string;
  members: { _id: string; name: string; email: string }[];
  invites?: { email: string; status: 'pending' | 'accepted' | 'rejected'; createdAt?: string }[];
  creator: { _id: string; name: string; email: string };
}

interface FormData {
  title: string;
  description: string;
  start: string;
  end: string;
  type: 'meeting' | 'workshop' | 'deadline' | 'social';
  isPublic: boolean;
}

const EventInterfacePage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const user = useSelector((state: RootState) => selectUser(state));
  const navigate = useNavigate(); // ✅ ajoute ceci

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [teamFormData, setTeamFormData] = useState({
    name: '',
    description: '',
    memberEmails: [] as string[]
  });
  const [newEmailInput, setNewEmailInput] = useState('');
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    start: '',
    end: '',
    type: 'meeting',
    isPublic: true
  });
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  const API_BASE = 'http://localhost:3000/api';

  // Fetch event details
  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId || !user?._id) return;
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE}/events/${eventId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const eventData = res.data.data;
        setEvent(eventData);
        setFormData({
          title: eventData.title,
          description: eventData.description || '',
          start: new Date(eventData.start).toISOString().slice(0, 16),
          end: new Date(eventData.end).toISOString().slice(0, 16),
          type: eventData.type,
          isPublic: eventData.isPublic
        });
      } catch (err: any) {
        setError(err.response?.data?.error || 'Erreur lors du chargement des détails');
      } finally {
        setLoading(false);
      }
    };
    fetchEventDetails();
  }, [eventId, user?._id]);

  // Update event
  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id || !eventId) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = { ...formData, creatorId: user._id };
      const res = await axios.put(`${API_BASE}/events/${eventId}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setEvent(res.data.data);
      setShowEditModal(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la modification');
    } finally {
      setSubmitting(false);
    }
  };

  // Create team
  // Dans EventInterfacePage.tsx - Fonction handleCreateTeam (ligne ~155)
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id || !eventId) return;
  if (teamFormData.memberEmails.length === 0) {
    setError('Au moins un email membre est requis');
    return;
  }
  setSubmitting(true);
  setError(null);
  try {
    // Payload harmonisé : Direct champs backend (pas wrapper teamData)
    const payload = { 
      eventId,
      name: teamFormData.name,
      description: teamFormData.description,
      memberEmails: teamFormData.memberEmails, // Array emails
      creatorId: user._id 
    };
    console.log('Payload envoyé à /api/teams:', payload); // Debug : Check structure

    const res = await axios.post(`${API_BASE}/teams`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    console.log('Réponse backend:', res.data); // Debug : Check succès

    setEvent(res.data.data); // Refresh
      setShowCreateTeamModal(false);
    setTeamFormData({ name: '', description: '', memberEmails: [] });
    setNewEmailInput('');
    setError(null);
    setSuccessMessage('Team créée et invitations envoyées avec succès !');
    setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
    console.log('Erreur complète:', err.response); // Debug : Log backend error
    setError(err.response?.data?.error || 'Erreur lors de la création de l\'équipe');
    } finally {
    setSubmitting(false);
    }
  };

  // Delete event
  const requestDeleteEvent = () => {
    setConfirmAction(() => () => {
      setSubmitting(true);
      axios.delete(`${API_BASE}/events/${eventId}`, {
        data: { creatorId: user!._id },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      }).then(() => {
        navigate('/events');
      }).catch((err: any) => {
        setError(err.response?.data?.error || 'Erreur lors de la suppression');
        setSubmitting(false);
      });
    });
    setConfirmMessage('Êtes-vous sûr de vouloir supprimer cet événement ? Cette action est irréversible.');
    setShowConfirmModal(true);
  };

  // Handle confirm
  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction();
    }
    setShowConfirmModal(false);
  };

  // Form handlers
  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type: inputType } = e.target;
    if (inputType === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleTeamFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
      setTeamFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  // Ajouter un email à la liste
  const handleAddEmail = () => {
    const email = newEmailInput.trim();
    if (!email) return;
    
    // Validation email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }
    
    // Vérifier si l'email n'est pas déjà dans la liste
    if (teamFormData.memberEmails.includes(email)) {
      setError('Cet email est déjà dans la liste');
      return;
    }
    
    setTeamFormData(prev => ({
      ...prev,
      memberEmails: [...prev.memberEmails, email]
    }));
    setNewEmailInput('');
    setError(null);
  };

  // Supprimer un email de la liste
  const handleRemoveEmail = (emailToRemove: string) => {
    setTeamFormData(prev => ({
      ...prev,
      memberEmails: prev.memberEmails.filter(email => email !== emailToRemove)
    }));
  };

  // Gérer la touche Entrée dans le champ email
  const handleEmailInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  // Type badge colors
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

  // Format date
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

  const calculateDuration = () => {
    if (!event) return '';
    const start = new Date(event.start);
    const end = new Date(event.end);
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
    }
    return `${minutes}min`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-12 w-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600 text-lg">Chargement des détails de l'événement...</p>
      </div>
    );
  }

  // Error state
  if (error && !event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button
          onClick={() => navigate('/events')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour au calendrier
        </button>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <FileText className="h-16 w-16 text-gray-400 mb-4" />
        <p className="text-gray-600 text-lg">Événement non trouvé.</p>
      </div>
    );
  }

  const isCreator = user?._id === event.creator._id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Banner */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-start">
            <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="ml-4 text-green-500 hover:text-green-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-500 hover:text-red-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={() => navigate('/events')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors group"
        >
          <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Retour au calendrier</span>
        </button>

        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-purple-500 to-blue-600 px-8 py-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getTypeColor(event.type)}`}>
                    {getTypeLabel(event.type)}
                  </span>
                  {event.isPublic ? (
                    <span className="flex items-center px-3 py-1 rounded-full text-sm bg-white/20 text-white">
                      <Globe className="h-4 w-4 mr-1" />
                      Public
                    </span>
                  ) : (
                    <span className="flex items-center px-3 py-1 rounded-full text-sm bg-white/20 text-white">
                      <Lock className="h-4 w-4 mr-1" />
                      Privé
                    </span>
                  )}
                </div>
                <h1 className="text-4xl font-bold text-white mb-2">{event.title}</h1>
                {event.description && (
                  <p className="text-white/90 text-lg mt-2 line-clamp-2">{event.description}</p>
                )}
              </div>
              {isCreator && (
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                    title="Modifier"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={requestDeleteEvent}
                    className="p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Event Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500 mb-1">Date de début</p>
                <p className="text-lg font-semibold text-gray-900">{formatDate(event.start)}</p>
                <p className="text-sm text-gray-600 mt-1">{formatTime(event.start)}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500 mb-1">Date de fin</p>
                <p className="text-lg font-semibold text-gray-900">{formatDate(event.end)}</p>
                <p className="text-sm text-gray-600 mt-1">{formatTime(event.end)}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500 mb-1">Durée</p>
                <p className="text-lg font-semibold text-gray-900">{calculateDuration()}</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500 mb-1">Créateur</p>
                <p className="text-lg font-semibold text-gray-900 truncate">{event.creator.name}</p>
                <p className="text-sm text-gray-600 truncate">{event.creator.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <FileText className="h-6 w-6 text-gray-700 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Description</h2>
            </div>
            {isCreator && (
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PencilIcon className="h-4 w-4 mr-2" />
                Modifier
              </button>
            )}
          </div>
          {event.description ? (
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed">{event.description}</p>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">Aucune description fournie</p>
            </div>
          )}
        </div>

        {/* Teams Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Users className="h-6 w-6 text-gray-700 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Équipes</h2>
              {event.teams && event.teams.length > 0 && (
                <span className="ml-3 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                  {event.teams.length}
                </span>
              )}
            </div>
            {isCreator && (
              <button
                onClick={() => setShowCreateTeamModal(true)}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
              >
                <Plus className="h-5 w-5 mr-2" />
                Créer une équipe
              </button>
            )}
          </div>

          {event.teams && event.teams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {event.teams.map((team) => (
                <div
                  key={team._id}
                  className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow bg-gradient-to-br from-white to-gray-50"
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">{team.name}</h3>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                        {team.members?.length || 0} membres
                      </div>
                      {team.invites && team.invites.filter(i => i.status === 'pending').length > 0 && (
                        <div className="flex items-center px-2 py-1 bg-red-100 text-red-800 rounded-md text-xs font-medium">
                          {team.invites.filter(i => i.status === 'pending').length} en attente
                        </div>
                      )}
                    </div>
                  </div>
                  {team.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{team.description}</p>
                  )}
                  
                  {/* Membres acceptés */}
                  {team.members && team.members.length > 0 && (
                    <div className="space-y-2 mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Membres acceptés</p>
                      <div className="flex flex-wrap gap-2">
                        {team.members.map((member) => (
                          <div
                            key={member._id}
                            className="flex items-center px-2 py-1 bg-green-50 border border-green-200 rounded-md text-sm"
                          >
                            <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold mr-2">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-gray-700 font-medium">{member.name}</span>
                            <CheckCircle2 className="h-3 w-3 text-green-600 ml-1" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Invitations en attente */}
                  {team.invites && team.invites.filter(i => i.status === 'pending').length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-red-600 uppercase tracking-wide flex items-center">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Invitations en attente
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {team.invites
                          .filter(invite => invite.status === 'pending')
                          .map((invite, index) => (
                            <div
                              key={index}
                              className="flex items-center px-2 py-1 bg-red-50 border-2 border-red-300 rounded-md text-sm"
                            >
                              <Mail className="h-4 w-4 text-red-600 mr-2" />
                              <span className="text-red-800 font-medium">{invite.email}</span>
                              <div className="ml-2 h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                            </div>
                          ))}
                      </div>
                      <p className="text-xs text-red-600 mt-1">
                        Ces personnes n'ont pas encore accepté l'invitation
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">Aucune équipe associée</p>
              {isCreator && (
                <button
                  onClick={() => setShowCreateTeamModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors mt-4"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Créer la première équipe
                </button>
              )}
            </div>
          )}
      </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Shield className="h-6 w-6 text-gray-700 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Actions</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <button className="flex items-center p-6 border border-gray-200 rounded-xl hover:border-purple-300 transition-colors group">
              <div className="bg-purple-100 p-3 rounded-lg group-hover:bg-purple-200 transition-colors mr-4">
                <Tag className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Inviter des membres</h3>
                <p className="text-gray-600">Ajoutez des participants à cet événement</p>
              </div>
            </button>
            <button className="flex items-center p-6 border border-gray-200 rounded-xl hover:border-green-300 transition-colors group">
              <div className="bg-green-100 p-3 rounded-lg group-hover:bg-green-200 transition-colors mr-4">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Assigner des tâches</h3>
                <p className="text-gray-600">Créez et attribuez des tâches liées à cet événement</p>
              </div>
            </button>
            {isCreator && (
              <button onClick={requestDeleteEvent} className="flex items-center p-6 border border-red-200 rounded-xl hover:border-red-300 transition-colors group">
                <div className="bg-red-100 p-3 rounded-lg group-hover:bg-red-200 transition-colors mr-4">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-900 mb-1">Supprimer l'événement</h3>
                  <p className="text-red-600">Cette action est irréversible</p>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Edit Event Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h3 className="text-2xl font-bold text-gray-900">Modifier l'événement</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleUpdateEvent} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titre *
                  </label>
                  <input
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Titre de l'événement"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Description de l'événement"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de début *
                    </label>
                    <input
                      type="datetime-local"
                      name="start"
                      required
                      value={formData.start}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de fin *
                    </label>
                    <input
                      type="datetime-local"
                      name="end"
                      required
                      value={formData.end}
                      onChange={handleFormChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleFormChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="meeting">Réunion</option>
                    <option value="workshop">Travail</option>
                    <option value="deadline">Échéance</option>
                    <option value="social">Personnel</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <input
                    name="isPublic"
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={handleFormChange}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-700">
                    Événement public
                  </label>
                </div>
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                  Annuler
                </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Enregistrer
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Team Modal (avec Input Multi-Emails Dynamique) */}
        {showCreateTeamModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
              <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-900">Créer une équipe</h3>
                <button
                  onClick={() => {
                    setShowCreateTeamModal(false);
                    setTeamFormData({ name: '', description: '', memberEmails: [] });
                    setNewEmailInput('');
                    setError(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleCreateTeam} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'équipe *
                  </label>
                  <input
                    name="name"
                    required
                    value={teamFormData.name}
                    onChange={handleTeamFormChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Nom de l'équipe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={teamFormData.description}
                    onChange={handleTeamFormChange}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Description de l'équipe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Membres de l'équipe *
                  </label>
                  
                  {/* Input pour ajouter un email */}
                  <div className="flex gap-2 mb-4">
                    <div className="flex-1 relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        value={newEmailInput}
                        onChange={(e) => setNewEmailInput(e.target.value)}
                        onKeyPress={handleEmailInputKeyPress}
                        placeholder="Entrez l'email du membre"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddEmail}
                      disabled={!newEmailInput.trim()}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Ajouter
                    </button>
                  </div>

                  {/* Liste des emails ajoutés */}
                  {teamFormData.memberEmails.length > 0 ? (
                    <div className="space-y-2 mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Membres ajoutés ({teamFormData.memberEmails.length})
                      </p>
                      <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200 min-h-[80px]">
                        {teamFormData.memberEmails.map((email, index) => (
                          <div
                            key={index}
                            className="group flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:border-purple-400 transition-all"
                          >
                            <Mail className="h-4 w-4 text-purple-500 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-700">{email}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveEmail(email)}
                              className="ml-1 p-1 hover:bg-red-100 rounded-full transition-colors"
                              title="Supprimer"
                            >
                              <XCircle className="h-4 w-4 text-gray-400 hover:text-red-600" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500">
                        Les invitations seront envoyées automatiquement à ces adresses après la création de l'équipe.
                      </p>
                    </div>
                  ) : (
                    <div className="p-6 border-2 border-dashed border-gray-300 rounded-lg text-center bg-gray-50">
                      <Mail className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        Aucun membre ajouté. Utilisez le champ ci-dessus pour ajouter des membres.
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateTeamModal(false);
                      setTeamFormData({ name: '', description: '', memberEmails: [] });
                      setNewEmailInput('');
                      setError(null);
                    }}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || teamFormData.memberEmails.length === 0}
                    className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Création...
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5 mr-2" />
                        Créer et Envoyer Invites
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-start mb-6">
                  <div className="flex-shrink-0">
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmation</h3>
                    <p className="text-gray-700">{confirmMessage}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={submitting}
                    className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Traitement...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-5 w-5 mr-2" />
                        Confirmer
                      </>
                    )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default EventInterfacePage;