import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { useUpdateUserMutation } from '@/store/services/authApi';
import { Camera, Mail, User, Building, Phone, MapPin } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserProfileData {
  name: string;
  email: string;
  phone: string;
  address: string;
  company?: string;
  bio: string;
  // Role-specific fields
  farmSize?: number;
  mainCrops?: string;
  storeLocation?: string;
  businessType?: string;
}

export default function UserProfile() {
  const user = useSelector(selectCurrentUser);
  const { toast } = useToast();
  const [updateUser] = useUpdateUserMutation();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    company: user?.company || '',
    bio: user?.bio || '',
    farmSize: user?.farmSize,
    mainCrops: user?.mainCrops || '',
    storeLocation: user?.storeLocation || '',
    businessType: user?.businessType || '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      await updateUser({
        userId: user?._id,
        ...profileData
      }).unwrap();
      
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile. Please try again.",
      });
    }
  };

  const renderRoleSpecificFields = () => {
    switch (user?.role?.toLowerCase()) {
      case 'farmer':
        return (
          <div className="space-y-4">
            <div>
              <Label>Farm Size</Label>
              <Input
                name="farmSize"
                value={profileData.farmSize || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Farm size in hectares"
              />
            </div>
            <div>
              <Label>Main Crops</Label>
              <Input
                name="mainCrops"
                value={profileData.mainCrops || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="e.g., Wheat, Corn, Soybeans"
              />
            </div>
          </div>
        );
      case 'retailer':
        return (
          <div className="space-y-4">
            <div>
              <Label>Store Location</Label>
              <Input
                name="storeLocation"
                value={profileData.storeLocation || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Store address"
              />
            </div>
            <div>
              <Label>Business Type</Label>
              <Input
                name="businessType"
                value={profileData.businessType || ''}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="e.g., Supermarket, Wholesale"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="profile" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="settings">Account Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Profile Details</CardTitle>
                  <CardDescription>
                    Manage your profile information
                  </CardDescription>
                </div>
                <div className="flex gap-4">
                  {isEditing ? (
                    <>
                      <Button onClick={handleSave} className="bg-primary text-white">
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setIsEditing(true)}>
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  {/* Profile Image */}
                  <div className="flex justify-center">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-16 h-16 text-gray-400" />
                      </div>
                      {isEditing && (
                        <Button
                          size="icon"
                          variant="outline"
                          className="absolute bottom-0 right-0 rounded-full"
                        >
                          <Camera className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div className="space-y-4">
                    <div>
                      <Label>Full Name</Label>
                      <Input
                        name="name"
                        value={profileData.name}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        name="email"
                        type="email"
                        value={profileData.email}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        name="phone"
                        value={profileData.phone}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Role Specific Information */}
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <h3 className="font-semibold text-lg mb-4 text-primary">
                      {user?.role} Information
                    </h3>
                    {renderRoleSpecificFields()}
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-4">
                    <div>
                      <Label>Address</Label>
                      <Input
                        name="address"
                        value={profileData.address}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                      />
                    </div>
                    <div>
                      <Label>Bio</Label>
                      <textarea
                        name="bio"
                        value={profileData.bio}
                        onChange={handleInputChange}
                        disabled={!isEditing}
                        className="w-full min-h-[100px] p-2 border rounded-md"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>
                Manage your account settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add account settings options here */}
              <Button variant="destructive" className="w-full">
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
