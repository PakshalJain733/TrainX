import { useEffect, useState } from "react";
import { User, Building, Users, GraduationCap, ShieldCheck, Mail } from "lucide-react";
import { SectionHeader } from "../../../components/ui/SectionHeader";
import { apiFetch } from "../../../utils/api";
import "../Styles/MN_ProfilePage.css";

const unwrap = (response) => {
  if (!response || response.error) return null;
  return response.data !== undefined ? response.data : response;
};

const firstValue = (source, keys) => {
  if (!source || typeof source !== "object") return null;
  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") return value;
  }
  return null;
};

const textValue = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === "object") {
    const nested = firstValue(value, ["name", "title", "code"]);
    return nested ? String(nested) : null;
  }
  const text = String(value).trim();
  return text || null;
};

const asNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const getCount = (profile, keys, listKey) => {
  const value = asNumber(firstValue(profile, keys));
  if (value !== null) return value;
  const list = firstValue(profile, [listKey]);
  return Array.isArray(list) ? list.length : 0;
};

const getInitials = (name) => {
  if (!name || name === "N/A") return "—";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length > 1) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

export default function ProfilePage() {
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    apiFetch("/mentor/profile")
      .then((response) => {
        if (!mounted) return;
        const payload = unwrap(response);
        const rawProfile = payload?.profile || payload?.user || payload;
        setProfile(rawProfile && typeof rawProfile === "object" ? rawProfile : {});
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const source = profile.user && typeof profile.user === "object" ? profile.user : profile;
  const name = textValue(firstValue(source, ["name", "fullName", "full_name"])) || "N/A";
  const mobile = textValue(firstValue(source, ["mobile", "mobile_number", "mobileNumber", "phone"])) || "N/A";
  const email = textValue(firstValue(source, ["email"])) || "N/A";
  const college = textValue(firstValue(source, ["college", "collegeName", "college_name", "institution"])) || "N/A";
  const role = textValue(firstValue(source, ["role", "designation", "title"])) || "N/A";
  const department = textValue(firstValue(source, ["department", "dept"])) || "N/A";
  const assignedStudents = getCount(source, ["assignedStudents", "assignedStudentCount", "totalStudentsAssigned", "studentCount", "studentsCount", "total_students"], "students");
  const assignedBatches = getCount(source, ["assignedBatches", "assignedBatchCount", "totalBatchesAssigned", "batchCount", "batchesCount", "total_batches"], "batches");

  const details = [
    { label: "Mobile", value: mobile, icon: User },
    { label: "Email", value: email, icon: Mail },
    { label: "College", value: college, icon: Building },
    { label: "Role", value: role, icon: ShieldCheck },
    { label: "Department", value: department, icon: GraduationCap },
    { label: "Assigned Students", value: String(assignedStudents), icon: Users },
    { label: "Assigned Batches", value: String(assignedBatches), icon: Building },
  ];

  return (
    <div className="mentor-profile-container">
      <SectionHeader
        eyebrow="Mentor Account"
        title="My Profile"
        description="Authenticated mentor details and assigned academic scope returned by the mentor service."
      />

      {loading ? (
        <div className="mentor-profile-card">Loading profile...</div>
      ) : (
        <div className="mentor-profile-card">
          <div className="mentor-profile-header">
            <div className="mentor-profile-avatar">{getInitials(name)}</div>
            <div className="mentor-profile-info">
              <h2 className="mentor-profile-name">{name}</h2>
              <p className="mentor-profile-role">{role}</p>
              <p className="mentor-profile-dept">{department}</p>
            </div>
          </div>
          <div className="mentor-profile-grid">
            {details.map(({ label, value, icon: Icon }) => (
              <div key={label} className="mentor-profile-item">
                <span className="mentor-profile-label"><Icon size={13} /> {label}</span>
                <p className="mentor-profile-value">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
