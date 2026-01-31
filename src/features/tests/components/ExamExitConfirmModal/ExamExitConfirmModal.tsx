/**
 * ExamExitConfirmModal Component
 *
 * Модальное окно подтверждения выхода из режима экзамена
 */

export interface ExamExitConfirmModalProps {
  /** Показывать ли модальное окно */
  isOpen: boolean;
  /** Callback при подтверждении выхода */
  onConfirm: () => void;
  /** Callback при отмене */
  onCancel: () => void;
}

export function ExamExitConfirmModal({
  isOpen,
  onConfirm,
  onCancel
}: ExamExitConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚠️ Выход из экзамена</h2>
        </div>

        <div className="modal-body">
          <p className="warning-text">
            Вы уверены, что хотите выйти из режима экзамена?
          </p>
          <p className="warning-description">
            <strong>Прогресс экзамена будет полностью сброшен.</strong>
          </p>
          <p className="info-text">
            При следующем входе вам придётся начать экзамен заново с первого вопроса.
          </p>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Отмена
          </button>
          <button
            className="btn btn-danger"
            onClick={onConfirm}
          >
            Да, выйти
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
          animation: slideIn 0.2s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          padding: 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 24px;
          color: #dc2626;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .modal-body {
          padding: 24px;
        }

        .warning-text {
          font-size: 18px;
          color: #374151;
          margin: 0 0 16px 0;
          font-weight: 500;
        }

        .warning-description {
          background: #fef2f2;
          border-left: 4px solid #dc2626;
          padding: 12px 16px;
          margin: 0 0 16px 0;
          border-radius: 4px;
          color: #991b1b;
        }

        .warning-description strong {
          color: #7f1d1d;
        }

        .info-text {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
          line-height: 1.6;
        }

        .modal-footer {
          padding: 20px 24px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-secondary:hover {
          background: #e5e7eb;
        }

        .btn-danger {
          background: #dc2626;
          color: white;
        }

        .btn-danger:hover {
          background: #b91c1c;
        }

        @media (max-width: 640px) {
          .modal-content {
            margin: 0 16px;
          }

          .modal-footer {
            flex-direction: column-reverse;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
