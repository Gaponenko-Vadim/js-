'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchUserLists,
  createUserList,
  addTestToList,
  clearError,
} from '@/store/userListsSlice';
import styles from './AddToListModal.module.scss';

type AddToListModalProps = {
  testId: string;
  testTitle: string;
  isOpen: boolean;
  onClose: () => void;
};

export default function AddToListModal({
  testId,
  testTitle,
  isOpen,
  onClose,
}: AddToListModalProps) {
  const dispatch = useAppDispatch();
  const { lists, loading, error } = useAppSelector((state) => state.userLists);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListIcon, setNewListIcon] = useState('📋');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (isOpen && lists.length === 0) {
      dispatch(fetchUserLists());
    }
  }, [isOpen, dispatch, lists.length]);

  useEffect(() => {
    if (error) {
      setTimeout(() => dispatch(clearError()), 3000);
    }
  }, [error, dispatch]);

  if (!isOpen) return null;

  const handleAddToList = async (listId: string) => {
    setIsAdding(true);
    try {
      await dispatch(addTestToList({ listId, testId })).unwrap();
      onClose();
    } catch (err: any) {
      // Ошибка уже в Redux state
      console.error('Error adding test to list:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    setIsAdding(true);
    try {
      const result = await dispatch(
        createUserList({
          name: newListName.trim(),
          icon: newListIcon,
        })
      ).unwrap();

      // Автоматически добавляем тест в новый список
      await dispatch(addTestToList({ listId: result.id, testId })).unwrap();

      setNewListName('');
      setNewListIcon('📋');
      setShowCreateForm(false);
      onClose();
    } catch (err) {
      console.error('Error creating list:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const iconOptions = ['📋', '⭐', '🎯', '📚', '🔥', '💡', '✅', '🚀', '📝', '🎓'];

  // Проверяем, в каких списках уже есть этот тест
  const testInLists = new Set(
    lists
      .filter((list) => list.items.some((item) => item.testId === testId))
      .map((list) => list.id)
  );

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Добавить в список</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.testInfo}>
          <span className={styles.testTitle}>{testTitle}</span>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {loading && lists.length === 0 ? (
          <div className={styles.loading}>Загрузка списков...</div>
        ) : (
          <>
            {!showCreateForm ? (
              <>
                <div className={styles.listsList}>
                  {lists.length === 0 ? (
                    <div className={styles.noLists}>
                      <p>У вас пока нет списков</p>
                      <p className={styles.hint}>Создайте первый список!</p>
                    </div>
                  ) : (
                    lists.map((list) => {
                      const alreadyInList = testInLists.has(list.id);
                      return (
                        <button
                          key={list.id}
                          className={`${styles.listItem} ${alreadyInList ? styles.disabled : ''}`}
                          onClick={() => !alreadyInList && handleAddToList(list.id)}
                          disabled={alreadyInList || isAdding}
                        >
                          <span className={styles.listIcon}>{list.icon}</span>
                          <div className={styles.listInfo}>
                            <span className={styles.listName}>{list.name}</span>
                            <span className={styles.listCount}>
                              {list.items.length} {list.items.length === 1 ? 'тест' : 'тестов'}
                            </span>
                          </div>
                          {alreadyInList && (
                            <span className={styles.checkmark}>✓ Добавлен</span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>

                <button
                  className={styles.createButton}
                  onClick={() => setShowCreateForm(true)}
                  disabled={isAdding}
                >
                  + Создать новый список
                </button>
              </>
            ) : (
              <div className={styles.createForm}>
                <div className={styles.formGroup}>
                  <label>Иконка</label>
                  <div className={styles.iconPicker}>
                    {iconOptions.map((icon) => (
                      <button
                        key={icon}
                        className={`${styles.iconOption} ${newListIcon === icon ? styles.selected : ''}`}
                        onClick={() => setNewListIcon(icon)}
                        type="button"
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Название списка</label>
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Например: Повторить перед собеседованием"
                    className={styles.input}
                    autoFocus
                  />
                </div>

                <div className={styles.formActions}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewListName('');
                      setNewListIcon('📋');
                    }}
                    disabled={isAdding}
                  >
                    Отмена
                  </button>
                  <button
                    className={styles.submitButton}
                    onClick={handleCreateList}
                    disabled={!newListName.trim() || isAdding}
                  >
                    {isAdding ? 'Создание...' : 'Создать и добавить'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
