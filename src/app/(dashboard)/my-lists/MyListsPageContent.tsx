'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/layout/DashboardHeader';
import {
  useGetUserListsQuery,
  useCreateUserListMutation,
  useDeleteUserListMutation,
  useRemoveTestFromListMutation,
} from '@/features/user-lists';
import styles from './my-lists.module.scss';

export default function MyListsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // RTK Query hooks
  const { data: lists = [], isLoading: loading, error } = useGetUserListsQuery(undefined, {
    skip: !session
  });
  const [createList] = useCreateUserListMutation();
  const [deleteList] = useDeleteUserListMutation();
  const [removeTest] = useRemoveTestFromListMutation();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListIcon, setNewListIcon] = useState('📋');
  const [newListDescription, setNewListDescription] = useState('');
  const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set());
  const [selectedTests, setSelectedTests] = useState<Record<string, Set<string>>>({}); // listId -> Set of testIds

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    try {
      await createList({
        name: newListName.trim(),
        description: newListDescription.trim() || undefined,
        icon: newListIcon,
      }).unwrap();

      setNewListName('');
      setNewListDescription('');
      setNewListIcon('📋');
      setShowCreateModal(false);
    } catch (err) {
      console.error('Error creating list:', err);
    }
  };

  const handleDeleteList = async (listId: string, listName: string) => {
    if (!confirm(`Вы уверены, что хотите удалить список "${listName}"?`)) {
      return;
    }

    try {
      await deleteList(listId).unwrap();
    } catch (err) {
      console.error('Error deleting list:', err);
    }
  };

  const handleRemoveTest = async (listId: string, testId: string, testTitle: string) => {
    if (!confirm(`Удалить "${testTitle}" из списка?`)) {
      return;
    }

    try {
      await removeTest({ listId, testId }).unwrap();
    } catch (err) {
      console.error('Error removing test:', err);
    }
  };

  const toggleListExpanded = (listId: string) => {
    setExpandedLists((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(listId)) {
        newSet.delete(listId);
      } else {
        newSet.add(listId);
      }
      return newSet;
    });
  };

  const toggleTestSelection = (listId: string, testId: string) => {
    setSelectedTests((prev) => {
      const newState = { ...prev };
      if (!newState[listId]) {
        newState[listId] = new Set();
      }
      const listTests = new Set(newState[listId]);
      if (listTests.has(testId)) {
        listTests.delete(testId);
      } else {
        listTests.add(testId);
      }
      newState[listId] = listTests;
      return newState;
    });
  };

  const toggleAllTests = (listId: string, allTestIds: string[]) => {
    setSelectedTests((prev) => {
      const newState = { ...prev };
      const currentSelected = prev[listId] || new Set();

      if (currentSelected.size === allTestIds.length) {
        // Снять все
        newState[listId] = new Set();
      } else {
        // Выбрать все
        newState[listId] = new Set(allTestIds);
      }
      return newState;
    });
  };

  const handleTakeAllTests = (listId: string) => {
    const list = lists.find(l => l.id === listId);
    if (!list || !list.items || list.items.length === 0) return;

    const testIds = list.items.map(item => item.testId).join(',');
    router.push(`/combined-test?tests=${testIds}&listName=${encodeURIComponent(list.name)}`);
  };

  const handleTakeSelectedTests = (listId: string) => {
    const selected = selectedTests[listId];
    if (!selected || selected.size === 0) {
      alert('Выберите хотя бы один тест');
      return;
    }

    const list = lists.find(l => l.id === listId);
    const testIds = Array.from(selected).join(',');
    const listName = list ? list.name : 'Выбранные тесты';
    router.push(`/combined-test?tests=${testIds}&listName=${encodeURIComponent(listName)}`);
  };

  const iconOptions = ['📋', '⭐', '🎯', '📚', '🔥', '💡', '✅', '🚀', '📝', '🎓'];

  if (status === 'loading' || (loading && lists.length === 0)) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className={styles.container}>
      <DashboardHeader />

      <div className={styles.pageHeader}>
        <h1>📋 Мои списки</h1>
        <p>Управляйте своими коллекциями тестов</p>
      </div>

      <main className={styles.main}>
        <div className={styles.headerActions}>
          <div className={styles.stats}>
            <span className={styles.statItem}>
              <strong>{lists.length}</strong> {lists.length === 1 ? 'список' : lists.length < 5 ? 'списка' : 'списков'}
            </span>
            <span className={styles.statItem}>
              <strong>{lists.reduce((sum, list) => sum + (list.items?.length || 0), 0)}</strong> тестов всего
            </span>
          </div>
          <button className={styles.createButton} onClick={() => setShowCreateModal(true)}>
            + Создать список
          </button>
        </div>

        {error && <div className={styles.error}>Ошибка загрузки списков</div>}

        {lists.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📋</div>
            <h2>У вас пока нет списков</h2>
            <p>Создайте свой первый список для организации тестов</p>
            <button className={styles.primaryButton} onClick={() => setShowCreateModal(true)}>
              Создать первый список
            </button>
          </div>
        ) : (
          <div className={styles.listGrid}>
            {lists.map((list) => {
              const isExpanded = expandedLists.has(list.id);
              return (
                <div key={list.id} className={styles.listCard}>
                  <div className={styles.listHeader}>
                    <div className={styles.listTitle}>
                      <span className={styles.listIcon}>{list.icon}</span>
                      <div>
                        <h3>{list.name}</h3>
                        {list.description && <p className={styles.listDescription}>{list.description}</p>}
                      </div>
                    </div>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDeleteList(list.id, list.name)}
                      title="Удалить список"
                    >
                      🗑️
                    </button>
                  </div>

                  <div className={styles.listStats}>
                    <span className={styles.testCount}>
                      {list.items?.length || 0} {(list.items?.length || 0) === 1 ? 'тест' : (list.items?.length || 0) < 5 ? 'теста' : 'тестов'}
                    </span>
                    <span className={styles.createdDate}>
                      Создан {new Date(list.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>

                  {(list.items?.length || 0) > 0 && (
                    <>
                      <div className={styles.actionButtons}>
                        <button
                          className={styles.takeAllButton}
                          onClick={() => handleTakeAllTests(list.id)}
                        >
                          🚀 Пройти весь список
                        </button>
                        <button
                          className={styles.toggleButton}
                          onClick={() => toggleListExpanded(list.id)}
                        >
                          {isExpanded ? '▲ Свернуть' : '▼ Показать тесты'}
                        </button>
                      </div>

                      {isExpanded && (
                        <>
                          <div className={styles.selectionControls}>
                            <button
                              className={styles.selectAllButton}
                              onClick={() => toggleAllTests(list.id, list.items?.map(item => item.testId) || [])}
                            >
                              {(selectedTests[list.id]?.size === (list.items?.length || 0)) ? '☐ Снять все' : '☑ Выбрать все'}
                            </button>
                            <button
                              className={styles.takeSelectedButton}
                              onClick={() => handleTakeSelectedTests(list.id)}
                              disabled={!selectedTests[list.id] || selectedTests[list.id].size === 0}
                            >
                              🎯 Пройти выбранные ({selectedTests[list.id]?.size || 0})
                            </button>
                          </div>

                          <div className={styles.testsList}>
                            {list.items?.map((item) => (
                              <div key={item.id} className={styles.testItem}>
                                <input
                                  type="checkbox"
                                  className={styles.testCheckbox}
                                  checked={selectedTests[list.id]?.has(item.testId) || false}
                                  onChange={() => toggleTestSelection(list.id, item.testId)}
                                />
                                <Link href={`/tests/${item.testId}`} className={styles.testLink}>
                                  <span className={styles.testTitle}>{item.test?.title || 'Неизвестный тест'}</span>
                                  <span className={`${styles.testDifficulty} ${item.test?.difficulty ? styles[item.test.difficulty] : ''}`}>
                                    {item.test?.difficulty === 'beginner' && 'Начальный'}
                                    {item.test?.difficulty === 'intermediate' && 'Средний'}
                                    {item.test?.difficulty === 'advanced' && 'Продвинутый'}
                                  </span>
                                </Link>
                                <button
                                  className={styles.removeButton}
                                  onClick={() => handleRemoveTest(list.id, item.testId, item.test?.title || 'тест')}
                                  title="Удалить из списка"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {(!list.items || list.items.length === 0) && (
                    <div className={styles.emptyList}>
                      <p>Список пуст</p>
                      <Link href="/tests" className={styles.addTestsLink}>
                        Добавить тесты →
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {showCreateModal && (
          <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2>Создать новый список</h2>
                <button className={styles.closeButton} onClick={() => setShowCreateModal(false)}>
                  ✕
                </button>
              </div>

              <div className={styles.modalBody}>
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
                  <label>Название списка *</label>
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Например: Повторить перед собеседованием"
                    className={styles.input}
                    autoFocus
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Описание (опционально)</label>
                  <textarea
                    value={newListDescription}
                    onChange={(e) => setNewListDescription(e.target.value)}
                    placeholder="Краткое описание списка..."
                    className={styles.textarea}
                    rows={3}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  className={styles.cancelButton}
                  onClick={() => setShowCreateModal(false)}
                >
                  Отмена
                </button>
                <button
                  className={styles.submitButton}
                  onClick={handleCreateList}
                  disabled={!newListName.trim()}
                >
                  Создать список
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
