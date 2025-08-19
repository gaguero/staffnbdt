import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ProfilePhotoUpload from '../components/ProfilePhotoUpload';
import IDDocumentUpload from '../components/IDDocumentUpload';
import EmergencyContactsForm from '../components/EmergencyContactsForm';
import profileService, { Profile } from '../services/profileService';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    position: '',
    emergencyContact: {
      name: '',
      phoneNumber: ''
    }
  });

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoadingProfile(true);
        const profileData = await profileService.getProfile();
        setProfile(profileData);
        
        // Initialize form data with profile data
        setFormData({
          firstName: profileData.firstName || '',
          lastName: profileData.lastName || '',
          phoneNumber: profileData.phoneNumber || '',
          position: profileData.position || '',
          emergencyContact: {
            name: profileData.emergencyContact?.primaryContact?.name || '',
            phoneNumber: profileData.emergencyContact?.primaryContact?.phoneNumber || ''
          }
        });
      } catch (error) {
        console.error('Failed to load profile:', error);
        toast.error('Failed to load profile data');
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('emergencyContact.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Update basic profile
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        position: formData.position,
      };

      const updatedProfile = await profileService.updateProfile(updateData);
      
      // Update emergency contacts if they were provided
      if (formData.emergencyContact.name || formData.emergencyContact.phoneNumber) {
        await profileService.updateEmergencyContacts({
          primaryContact: {
            name: formData.emergencyContact.name,
            relationship: 'Emergency Contact',
            phoneNumber: formData.emergencyContact.phoneNumber,
          }
        });
      }

      // Update local state
      setProfile(updatedProfile);
      
      // Update auth context
      if (user) {
        updateUser({
          ...user,
          firstName: updatedProfile.firstName,
          lastName: updatedProfile.lastName,
          phoneNumber: updatedProfile.phoneNumber,
        });
      }
      
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phoneNumber: profile.phoneNumber || '',
        position: profile.position || '',
        emergencyContact: {
          name: profile.emergencyContact?.primaryContact?.name || '',
          phoneNumber: profile.emergencyContact?.primaryContact?.phoneNumber || ''
        }
      });
    }
    setIsEditing(false);
  };

  if (isLoadingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile not found</h2>
          <p className="text-gray-600">Unable to load your profile data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-First Header */}
      <div className="bg-gradient-to-br from-warm-gold to-sand relative overflow-hidden">
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="relative px-4 pt-6 pb-8">
          <div className="flex items-start space-x-4">
            {/* Profile Avatar */}
            <div className="relative">
              {profile.profilePhoto ? (
                <img 
                  src={profile.profilePhoto} 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full object-cover border-4 border-white/20 shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-2xl font-bold border-4 border-white/20 shadow-lg">
                  {profile.firstName?.[0]?.toUpperCase()}{profile.lastName?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            </div>
            
            {/* User Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white mb-1 truncate">
                {profile.firstName} {profile.lastName}
              </h1>
              <p className="text-white/80 text-sm mb-2 truncate">{profile.email}</p>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm">
                  {profile.role.replace('_', ' ')}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-white backdrop-blur-sm">
                  ✓ Verificado
                </span>
              </div>
            </div>
            
            {/* Edit Button */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="inline-flex items-center px-3 py-2 bg-white/20 backdrop-blur-sm text-white text-sm font-medium rounded-lg border border-white/20 hover:bg-white/30 transition-colors"
              disabled={isLoading}
            >
              {isEditing ? (
                <>
                  <span className="mr-1">✕</span>
                  Cancelar
                </>
              ) : (
                <>
                  <span className="mr-1">✏️</span>
                  Editar
                </>
              )}
            </button>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">12</div>
              <div className="text-white/70 text-xs">Entrenamientos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">8/20</div>
              <div className="text-white/70 text-xs">Vacaciones</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">15</div>
              <div className="text-white/70 text-xs">Documentos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex overflow-x-auto px-4">
          {[
            { id: 'personal', label: 'Personal', icon: '👤' },
            { id: 'emergency', label: 'Emergency Contacts', icon: '🚨' },
            { id: 'photo', label: 'Foto', icon: '📸' },
            { id: 'documents', label: 'Documentos', icon: '📄' },
            { id: 'security', label: 'Seguridad', icon: '🔒' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-warm-gold text-warm-gold'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Personal Information Tab */}
        {activeTab === 'personal' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="mr-2">👤</span>
                  Información Personal
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Mantén tu información actualizada para una mejor experiencia
                </p>
              </div>
              <div className="p-6">
                {isLoading ? (
                  <LoadingSpinner size="lg" text="Actualizando perfil..." />
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Nombre</label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-warm-gold focus:border-transparent transition-all ${
                            !isEditing ? 'bg-gray-50' : 'bg-white'
                          }`}
                          disabled={!isEditing}
                          required
                          placeholder="Tu nombre"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Apellido</label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          className={`w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-warm-gold focus:border-transparent transition-all ${
                            !isEditing ? 'bg-gray-50' : 'bg-white'
                          }`}
                          disabled={!isEditing}
                          required
                          placeholder="Tu apellido"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Correo Electrónico</label>
                      <input
                        type="email"
                        name="email"
                        value={profile.email}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 bg-gray-50 cursor-not-allowed"
                        disabled
                        placeholder="tu@email.com"
                      />
                      <p className="text-xs text-gray-500">El correo electrónico no se puede cambiar</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Teléfono</label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-warm-gold focus:border-transparent transition-all ${
                          !isEditing ? 'bg-gray-50' : 'bg-white'
                        }`}
                        disabled={!isEditing}
                        placeholder="+507 0000-0000"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Cargo/Posición</label>
                      <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-warm-gold focus:border-transparent transition-all ${
                          !isEditing ? 'bg-gray-50' : 'bg-white'
                        }`}
                        disabled={!isEditing}
                        placeholder="Tu cargo o posición"
                      />
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-900 mb-3 flex items-center">
                        <span className="mr-2">🚨</span>
                        Contacto de Emergencia
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-blue-800">Nombre del Contacto</label>
                          <input
                            type="text"
                            name="emergencyContact.name"
                            value={formData.emergencyContact.name}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border border-blue-200 rounded-lg text-gray-900 placeholder-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm ${
                              !isEditing ? 'bg-blue-50' : 'bg-white'
                            }`}
                            disabled={!isEditing}
                            placeholder="Nombre completo"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-blue-800">Teléfono de Emergencia</label>
                          <input
                            type="tel"
                            name="emergencyContact.phoneNumber"
                            value={formData.emergencyContact.phoneNumber}
                            onChange={handleInputChange}
                            className={`w-full px-3 py-2 border border-blue-200 rounded-lg text-gray-900 placeholder-blue-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm ${
                              !isEditing ? 'bg-blue-50' : 'bg-white'
                            }`}
                            disabled={!isEditing}
                            placeholder="+507 0000-0000"
                          />
                        </div>
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <button
                          type="submit"
                          className="flex-1 bg-warm-gold text-white py-3 px-6 rounded-lg font-medium hover:bg-warm-gold/90 transition-colors focus:ring-2 focus:ring-warm-gold focus:ring-offset-2"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="flex-1 sm:flex-none bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                          disabled={isLoading}
                        >
                          Cancelar
                        </button>
                      </div>
                    )}
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Emergency Contacts Tab */}
        {activeTab === 'emergency' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="mr-2">🚨</span>
                  Emergency Contacts
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Manage your emergency contact information
                </p>
              </div>
              <div className="p-6">
                <EmergencyContactsForm
                  initialData={profile?.emergencyContact || undefined}
                  onSuccess={() => {
                    // Reload profile to get updated data
                    const loadProfile = async () => {
                      try {
                        const profileData = await profileService.getProfile();
                        setProfile(profileData);
                      } catch (error) {
                        console.error('Failed to reload profile:', error);
                      }
                    };
                    loadProfile();
                  }}
                  standalone={true}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Photo Tab */}
        {activeTab === 'photo' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="mr-2">📸</span>
                  Foto de Perfil
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Personaliza tu perfil con una foto profesional
                </p>
              </div>
              <div className="p-6">
                <ProfilePhotoUpload 
                  currentPhotoUrl={profile.profilePhoto}
                  onPhotoUpdate={async (photoUrl) => {
                    // Update local state
                    setProfile(prev => prev ? { ...prev, profilePhoto: photoUrl } : null);
                    
                    // Update auth context
                    if (user) {
                      updateUser({ ...user, profilePhoto: photoUrl });
                    }
                    
                    toast.success('Profile photo updated successfully!');
                  }}
                  onPhotoDelete={async () => {
                    // Update local state
                    setProfile(prev => prev ? { ...prev, profilePhoto: undefined } : null);
                    
                    // Update auth context  
                    if (user) {
                      updateUser({ ...user, profilePhoto: undefined });
                    }
                    
                    toast.success('Profile photo removed successfully!');
                  }}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="mr-2">📄</span>
                  Verificación de Identidad
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Sube tu documento oficial para verificar tu cuenta
                </p>
              </div>
              <div className="p-6">
                <IDDocumentUpload
                  onStatusUpdate={(status) => {
                    console.log('ID verification status updated:', status);
                  }}
                  onDocumentUpdate={(hasDocument) => {
                    console.log('Document upload status:', hasDocument);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="mr-2">🔒</span>
                  Seguridad de la Cuenta
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Mantén tu cuenta segura con estas opciones
                </p>
              </div>
              <div className="p-6 space-y-4">
                <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <span className="text-blue-600">🔑</span>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Cambiar Contraseña</div>
                      <div className="text-sm text-gray-500">Actualiza tu contraseña regularmente</div>
                    </div>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
                
                <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                      <span className="text-green-600">📱</span>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Autenticación de Dos Factores</div>
                      <div className="text-sm text-gray-500">Protección adicional para tu cuenta</div>
                    </div>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
                
                <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                      <span className="text-purple-600">📋</span>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Historial de Actividad</div>
                      <div className="text-sm text-gray-500">Revisa tu actividad reciente</div>
                    </div>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
                
                <button className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                      <span className="text-orange-600">💾</span>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Descargar Mis Datos</div>
                      <div className="text-sm text-gray-500">Obtén una copia de tu información personal</div>
                    </div>
                  </div>
                  <span className="text-gray-400">→</span>
                </button>
              </div>
            </div>
            
            {/* Account Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="mr-2">📊</span>
                  Estadísticas de la Cuenta
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">Jan 2024</div>
                    <div className="text-sm text-blue-800">Miembro desde</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">15</div>
                    <div className="text-sm text-green-800">Documentos subidos</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;