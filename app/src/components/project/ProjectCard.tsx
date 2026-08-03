interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    color: string;
    icon: string | null;
    role: string;
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="bg-white border border-[#e9ecef] rounded-xl p-5 hover:border-[#ced4da] hover:shadow-sm transition-all cursor-pointer group">
      {/* Color bar */}
      <div
        className="h-1.5 w-10 rounded-full mb-4"
        style={{ backgroundColor: project.color }}
        aria-hidden="true"
      />

      <h3 className="font-semibold text-[#1a1a2e] truncate group-hover:text-[#4f46e5] transition-colors">
        {project.name}
      </h3>

      {project.description && (
        <p className="text-sm text-[#6c757d] mt-1 line-clamp-2">{project.description}</p>
      )}

      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-[#adb5bd] capitalize">{project.role}</span>
      </div>
    </div>
  );
}
