// pages/EventsPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import axios from 'axios';
import { PlusIcon, XMarkIcon, CalendarIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import { 
  Calendar, 
  Clock, 
  Globe, 
  Lock, 
  ArrowRight
} from 'lucide-react';

import { RootState } from '../store/store';
import { selectUser } from '../store/slices/authSlice';

interface EventData {
  _id?: string;
  title: string;
  description: string;
  start: string;
  end: string;
  type: 'meeting' | 'workshop' | 'deadline' | 'social';
  isPublic: boolean;
  color: string;
  creator?: { _id: string; name: string; email: string };
}

interface FormData {
  title: string;
  description: string;
  start: string;
  end: string;
  type: 'meeting' | 'workshop' | 'deadline' | 'social';
  isPublic: boolean;
}

const EventsPage: React.FC = () => {
  const user = useSelector((state: RootState) => selectUser(state));
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar'); // Nouveau : Mode vue (calendrier ou liste)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    start: '',
    end: '',
    type: 'meeting',
    isPublic: true
  });

  // Fetch user events
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user?._id) return;
      setLoading(true);
      try {
        const res = await axios.get(`http://localhost:3000/api/events?userId=${user._id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        setEvents(res.data.data || []);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Erreur chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [user?._id]);

  // Create event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?._id) return;
    setLoading(true);
    try {
      const payload = { ...formData, creatorId: user._id };
      const res = await axios.post('http://localhost:3000/api/events', payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setEvents((prev) => [...prev, res.data.data]);
      setShowCreateModal(false);
      // Reset form
      setFormData({
        title: '',
        description: '',
        start: '',
        end: '',
        type: 'meeting',
        isPublic: true
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur création');
    } finally {
      setLoading(false);
    }
  };

  // Stabilise onChange
  const handleFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type: inputType } = e.target;
    if (inputType === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  // Navigation intelligente : Clic event → Route dédiée
  const handleEventClick = (info: any) => {
    const eventId = info.event.id;
    if (eventId) {
      navigate(`/events/${eventId}`); // Navigation vers interface dédiée
    }
  };

  // Cards data
  const counts = {
    travail: events.filter((e) => e.type === 'workshop').length,
    personnel: events.filter((e) => e.type === 'social').length,
    reunions: events.filter((e) => e.type === 'meeting').length,
    autre: events.filter((e) => e.type === 'deadline').length,
  };

  // Modal création (stable, simple pour MVP)
  const CreateModalComponent = useMemo(() => (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center border-b border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-800">Nouvel Événement</h3>
          <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
          <input
            name="title"
            placeholder="Titre"
            required
            value={formData.title}
            onChange={handleFormChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <textarea
            name="description"
            placeholder="Description"
            value={formData.description}
            onChange={handleFormChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent h-20"
          />
          <input
            type="datetime-local"
            name="start"
            required
            value={formData.start}
            onChange={handleFormChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <input
            type="datetime-local"
            name="end"
            required
            value={formData.end}
            onChange={handleFormChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <select
            name="type"
            value={formData.type}
            onChange={handleFormChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="meeting">Réunion</option>
            <option value="workshop">Travail</option>
            <option value="deadline">Autre</option>
            <option value="social">Personnel</option>
          </select>
          <label className="flex items-center space-x-2">
            <input
              name="isPublic"
              type="checkbox"
              checked={formData.isPublic}
              onChange={handleFormChange}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700">Public</span>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer'}
          </button>
        </form>
      </div>
    </div>
  ), [formData, loading, handleFormChange, setShowCreateModal]);

  // Toggle vue (nouveau)
  const toggleView = () => {
    setViewMode(prev => prev === 'calendar' ? 'list' : 'calendar');
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const calculateDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = endDate.getTime() - startDate.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
    }
    return `${minutes}min`;
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

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      meeting: 'bg-blue-100 text-blue-800 border-blue-300',
      workshop: 'bg-purple-100 text-purple-800 border-purple-300',
      deadline: 'bg-orange-100 text-orange-800 border-orange-300',
      social: 'bg-purple-200 text-purple-800 border-purple-300'
    };
    return colors[type] || colors.meeting;
  };

  // Liste Cartes améliorée (nouveau, visible seulement en list mode)
  const ListViewComponent = useMemo(() => {
    if (events.length === 0) {
      return (
        <div className="text-center py-16">
          <Calendar className="h-20 w-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun événement</h3>
          <p className="text-gray-500 mb-6">Créez votre premier événement pour commencer</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg shadow-md hover:opacity-90 transition"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Créer un événement
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {events.map((event) => {
          const isPast = new Date(event.end) < new Date();
          return (
            <div
              key={event._id}
              className={`group bg-white rounded-xl shadow-md hover:shadow-xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
                isPast ? 'border-gray-200 opacity-75' : 'border-transparent hover:border-purple-200'
              }`}
              onClick={() => handleEventClick({ event: { id: event._id } })}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4 flex-1">
                    {/* Color indicator */}
                    <div 
                      className="w-1 h-full min-h-[80px] rounded-full flex-shrink-0"
                      style={{ backgroundColor: event.color }}
                    />
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                          {event.title}
                        </h3>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getTypeColor(event.type)}`}>
                          {getTypeLabel(event.type)}
                        </span>
                        {event.isPublic ? (
                          <span className="flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs">
                            <Globe className="h-3 w-3 mr-1" />
                            Public
                          </span>
                        ) : (
                          <span className="flex items-center px-2 py-1 bg-gray-50 text-gray-700 rounded-md text-xs">
                            <Lock className="h-3 w-3 mr-1" />
                            Privé
                          </span>
                        )}
                      </div>
                      
                      {event.description && (
                        <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
                      )}
                      
                      {/* Date and time info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center text-gray-700">
                          <Calendar className="h-4 w-4 mr-2 text-purple-500 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500">Début</p>
                            <p className="text-sm font-medium">{formatDate(event.start)}</p>
                            <p className="text-xs text-gray-500">{formatTime(event.start)}</p>
                          </div>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <Calendar className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500">Fin</p>
                            <p className="text-sm font-medium">{formatDate(event.end)}</p>
                            <p className="text-xs text-gray-500">{formatTime(event.end)}</p>
                          </div>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <Clock className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                          <div>
                            <p className="text-xs text-gray-500">Durée</p>
                            <p className="text-sm font-medium">{calculateDuration(event.start, event.end)}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Creator info */}
                      {event.creator && (
                        <div className="flex items-center text-gray-600 pt-3 border-t border-gray-100">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-400 to-blue-600 flex items-center justify-center mr-2">
                            <span className="text-xs font-bold text-white">
                              {event.creator.name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm">{event.creator.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Arrow indicator */}
                  <div className="flex-shrink-0 ml-4">
                    <div className="h-10 w-10 rounded-full bg-gray-100 group-hover:bg-gradient-to-r group-hover:from-purple-500 group-hover:to-blue-500 flex items-center justify-center transition-all duration-300">
                      <ArrowRight className="h-5 w-5 text-gray-600 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [events, handleEventClick, setShowCreateModal]);

  if (!user) return <div className="flex justify-center items-center min-h-screen">Connectez-vous pour voir vos événements.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
              Calendrier d'Événement
            </h1>
            <p className="text-gray-500 mt-1">Organisez vos journées avec style</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleView}
              className="flex items-center bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              {viewMode === 'calendar' ? (
                <>
                  <ListBulletIcon className="w-5 h-5 mr-2" />
                  List View
                </>
              ) : (
                <>
                  <CalendarIcon className="w-5 h-5 mr-2" />
                  Calendar View
                </>
              )}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:opacity-90 transition"
            >
              <PlusIcon className="w-5 h-5 mr-2" />
              Nouvel Événement
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white shadow-md rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Travail</p>
              <p className="text-xl font-bold">{counts.travail}</p>
            </div>
            <span className="h-3 w-3 rounded-full bg-blue-500" />
          </div>
          <div className="bg-white shadow-md rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Personnel</p>
              <p className="text-xl font-bold">{counts.personnel}</p>
            </div>
            <span className="h-3 w-3 rounded-full bg-purple-200" />
          </div>
          <div className="bg-white shadow-md rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Réunions</p>
              <p className="text-xl font-bold">{counts.reunions}</p>
            </div>
            <span className="h-3 w-3 rounded-full bg-purple-500" />
          </div>
          <div className="bg-white shadow-md rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Autre</p>
              <p className="text-xl font-bold">{counts.autre}</p>
            </div>
            <span className="h-3 w-3 rounded-full bg-green-500" />
          </div>
        </div>

        {/* Toggle View : Calendar ou List */}
        {viewMode === 'calendar' ? (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
            {/* Calendar Header Stats */}
            <div className="px-6 pt-6 pb-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Calendrier</h2>
                  <p className="text-sm text-gray-600">
                    {events.length} {events.length === 1 ? 'événement' : 'événements'} ce mois
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-white text-purple-700 rounded-lg text-sm font-medium border border-purple-200 shadow-sm">
                    {events.filter(e => {
                      const eventDate = new Date(e.start);
                      const now = new Date();
                      return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
                    }).length} ce mois
                  </span>
                </div>
              </div>
            </div>
            
            {/* Calendar */}
            <div className="p-4">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                height="auto"
                events={events.map((e) => ({
                  id: e._id,
                  title: e.title,
                  start: e.start,
                  end: e.end,
                  backgroundColor: e.color,
                  borderColor: e.color,
                  textColor: '#ffffff',
                  classNames: ['event-custom'],
                  extendedProps: {
                    type: e.type,
                    description: e.description,
                    isPublic: e.isPublic,
                  }
                }))}
                eventClick={handleEventClick}
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay',
                }}
                eventDisplay="block"
                eventTextColor="#fff"
                dayMaxEvents={3}
                moreLinkClick="popover"
                locale={frLocale}
                firstDay={1}
                weekends={true}
                weekNumbers={false}
                nowIndicator={true}
                dayHeaderFormat={{ weekday: 'short' }}
                slotLabelFormat={{
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                }}
                eventTimeFormat={{
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                }}
                views={{
                  dayGridMonth: {
                    dayHeaderFormat: { weekday: 'short' },
                    titleFormat: { year: 'numeric', month: 'long' },
                  },
                  timeGridWeek: {
                    titleFormat: { year: 'numeric', month: 'short', day: 'numeric' },
                  },
                  timeGridDay: {
                    titleFormat: { year: 'numeric', month: 'short', day: 'numeric' },
                  },
                }}
                buttonText={{
                  today: 'Aujourd\'hui',
                  month: 'Mois',
                  week: 'Semaine',
                  day: 'Jour',
                }}
                eventMouseEnter={(info) => {
                  info.el.style.transform = 'scale(1.02)';
                  info.el.style.zIndex = '1000';
                }}
                eventMouseLeave={(info) => {
                  info.el.style.transform = 'scale(1)';
                  info.el.style.zIndex = '1';
                }}
              />
            </div>
            
            {/* Legend */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">Légende:</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-xs text-gray-600">Réunion</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-xs text-gray-600">Travail</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-xs text-gray-600">Échéance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                    <span className="text-xs text-gray-600">Personnel</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Liste des Événements</h2>
                <p className="text-sm text-gray-500">
                  {events.length} {events.length === 1 ? 'événement' : 'événements'} au total
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium border border-purple-200">
                  {events.filter(e => new Date(e.end) >= new Date()).length} à venir
                </span>
                <span className="px-3 py-1 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium border border-gray-200">
                  {events.filter(e => new Date(e.end) < new Date()).length} passés
                </span>
              </div>
            </div>
            {ListViewComponent}
          </div>
        )}

        {/* Modal Création */}
        {showCreateModal && CreateModalComponent}
      </div>
    </div>
  );
};

export default EventsPage;