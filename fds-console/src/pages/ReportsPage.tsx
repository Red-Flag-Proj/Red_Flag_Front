import { Download, FileText, Table, type LucideIcon } from 'lucide-react';
import { fdsService } from '../services/fdsService';

const ReportsPage: React.FC = () => (
  <div className="fds-page-stack">
    <div>
      {/* <p className="fds-kicker">// 리포트</p> */}
      <h2 className="fds-page-title">리포트</h2>
      <p className="fds-page-copy">탐지 결과와 조치 상태를 CSV 또는 PDF로 다운로드합니다.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

const ReportCard = ({ icon: Icon, title, description, buttonLabel, onClick }: { icon: LucideIcon; title: string; description: string; buttonLabel: string; onClick: () => void }) => (
  <div className="fds-card fds-card-pad" style={{ borderTop: '2px solid var(--red-vivid)' }}>
    <div className="w-12 h-12 rounded-[3px] border border-[rgba(255,44,61,0.22)] bg-[rgba(255,44,61,0.08)] text-[var(--red-vivid)] flex items-center justify-center mb-5">
      <Icon className="w-6 h-6" />
    </div>
    <h3 className="fds-panel-title">{title}</h3>
    <p className="fds-panel-subtitle min-h-16">{description}</p>
    <button onClick={onClick} className="fds-btn fds-btn-primary mt-6">
      <Download className="w-4 h-4" />
      {buttonLabel}
    </button>
  </div>
);

export default ReportsPage;
