import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getProfile } from "../services/profileService";

interface ProfileData {
  id: string;
  full_name: string | null;
  email: string | null;
  college: string | null;
  department: string | null;
  semester: number | null;
  profile_image: string | null;
}

function Profile() {
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        const data = await getProfile(user.id);
        setProfile(data);
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <p className="text-slate-500">Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="flex-1 px-6 py-8">

      <h1 className="text-3xl font-bold text-slate-800">
        My Profile
      </h1>

      <p className="mt-2 text-slate-500">
        View your academic profile information.
      </p>

      <div className="mt-8 max-w-2xl bg-white rounded-2xl shadow-sm p-8">

        <div className="space-y-6">

          <div>
            <p className="text-sm text-slate-500">
              Full Name
            </p>

            <p className="mt-1 text-lg font-medium text-slate-800">
              {profile?.full_name || "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Email
            </p>

            <p className="mt-1 text-lg font-medium text-slate-800">
              {profile?.email || user?.email}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              College
            </p>

            <p className="mt-1 text-lg font-medium text-slate-800">
              {profile?.college || "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Department
            </p>

            <p className="mt-1 text-lg font-medium text-slate-800">
              {profile?.department || "Not provided"}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-500">
              Semester
            </p>

            <p className="mt-1 text-lg font-medium text-slate-800">
              {profile?.semester || "Not provided"}
            </p>
          </div>

        </div>

      </div>

    </main>
  );
}

export default Profile;