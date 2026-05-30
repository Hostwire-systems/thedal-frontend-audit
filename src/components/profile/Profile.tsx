import React from 'react';
import { User } from 'lucide-react';
import DefaultPhoto from '../../assets/images/cadre-sample-image.jpg'; 
import { Image } from 'antd';
import { UserOutlined } from '@ant-design/icons';


interface ProfileSectionProps {
  firstName: string,
  photoUrl: string,
  email: string,
  lastName: string
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
  firstName,
  email,
  photoUrl,
  lastName,
}) => (
  <div className="flex items-center mb-4">
    {photoUrl ? (
      <Image
        src={photoUrl}
        alt="Profile"
        width={96} // 24 * 4 (Tailwind's w-24)
        height={96} // 24 * 4 (Tailwind's h-24)
        className="rounded-full object-cover cursor-pointer"
      />
    ) : (
      <div className="flex items-center justify-center rounded-full w-24 h-24 mr-4 bg-gray-200 cursor-pointer">
        <UserOutlined className="text-4xl text-gray-500" />
      </div>
    )}

    <div>
      <h3 className="text-lg font-semibold text-gray-900">
        {firstName} {lastName}
      </h3>
      <p className="text-sm text-gray-600">{email}</p>
    </div>
  </div>
);

export default ProfileSection;