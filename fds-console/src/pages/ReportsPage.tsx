import { Download, FileText, Table } from 'lucide-react';
import { fdsService } from '../services/fdsService';

const ReportsPage: React.FC = () => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <div>
      <h2 className="text-2xl font-bold text-slate-100">리포트</h2>
      <p className="text-slate-500 text-sm">탐지 결과와 조치 상태를 CSV 또는 PDF로 다운로드합니다.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ReportCard
        icon={Table}
        title="CSV 리포트"
        description="거래 ID, 사용자, 금액, 위험 점수, 위험 등급, 거래 상태, 조치 결과를 표 형태로 저장합니다."
        buttonLabel="CSV 다운로드"
        onClick={() => fdsService.downloadReport('csv')}
      />
      <ReportCard
        icon={FileText}
        title="PDF 리포트"
        description="관리자 제출용 요약 리포트를 PDF로 생성합니다. 상위 거래와 위험 사유가 포함됩니다."
        buttonLabel="PDF 다운로드"
        onClick={() => fdsService.downloadReport('pdf')}
      />
    </div>
  </div>
);

const ReportCard = ({ icon: Icon, title, description, buttonLabel, onClick }: { icon: any; title: string; description: string; buttonLabel: string; onClick: () => void }) => (
  <div className="fds-card p-6">
    <div className="w-12 h-12 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-5">
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="text-lg font-bold text-slate-100">{title}</h3>
    <p className="text-sm text-slate-500 mt-2 min-h-16">{description}</p>
    <button onClick={onClick} className="mt-6 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-500">
      <Download className="w-4 h-4" />
      {buttonLabel}
    </button>
  </div>
);

export default ReportsPage;
