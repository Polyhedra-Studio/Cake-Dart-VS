import 'package:cycle_models/cycle_models.dart';
import 'package:cake/cake.dart';

void main() {
  TestRunnerWithContext<dynamic, _TaskListTestContext>(
    'Task List',
    [
      GroupWithContext<TaskListMock, _TaskListTestContext<TaskListMock>>(
        'Init',
        [
          TestWithContext('should init - with mock',
              actual: TaskListMock(name: 'My cool list'),
              assertions: (test) => [Expect.isNotNull(test.actual)]),
          TestWithContext('blank mock task list should init',
              actual: TaskListMock(),
              assertions: (test) => [Expect.isNotNull(test.actual)]),
          TestWithContext(
            'should init from basic map',
            action: (test) => TaskListMock.fromMap(test.mockMapBasic),
            assertions: (test) => [Expect.isNotNull(test.actual)],
          ),
          TestWithContext('should assign values from basic map',
              action: (test) => TaskListMock.fromMap(test.mockMapBasic),
              assertions: (test) => [
                    Expect.isNotNull(test.actual),
                    Expect.equals(
                        actual: test.actual!.id,
                        expected: test.mockMapBasic[TaskListProperties.id]),
                    Expect.equals(
                        actual: test.actual!.name,
                        expected: test.mockMapBasic[TaskListProperties.name]),
                    Expect.equals(
                        actual: test.actual!.sortMode,
                        expected:
                            test.mockMapBasic[TaskListProperties.sortMode]),
                    Expect.equals(
                        actual: test.actual!.sortDirectionDec,
                        expected: test
                            .mockMapBasic[TaskListProperties.sortDirectionDec]),
                    Expect.equals(
                        actual: test.actual!.tasks,
                        expected:
                            test.mockMapBasic[TaskListProperties.taskItems]),
                    Expect.equals(
                        actual: test.actual!.categories,
                        expected:
                            test.mockMapBasic[TaskListProperties.categories]),
                    Expect.equals(
                        actual: test.actual!.history,
                        expected:
                            test.mockMapBasic[TaskListProperties.history]),
                  ]),
          TestWithContext('should convert to map',
              action: (test) => TaskListMock.fromMap(test.mockMapBasic),
              assertions: (test) => [
                    Expect.equals(
                        actual: test.actual!.toMap(),
                        expected: test.mockMapBasic),
                  ]),
        ],
        contextBuilder: _TaskListTestContext<TaskListMock>.new,
      ),
      GroupWithContext<TaskListMock, _TaskListTestContext<TaskListMock>>(
        'Update List Properties',
        [
          TestWithContext('should update sort if different',
              action: (test) {
                test.list.updateSort(SortType.completed);
              },
              assertions: (test) => [
                    Expect.equals(actual: test.list.writeCount, expected: 1),
                    Expect.equals(
                        actual: test.list.sortMode,
                        expected: SortType.completed),
                    Expect.isFalse(test.list.sortDirectionDec),
                  ]),
          TestWithContext(
              'should flip the sort direction if update sort is the same',
              action: (test) {
                test.list.updateSort(test.list.sortMode);
              },
              assertions: (test) => [
                    Expect.equals(actual: test.list.writeCount, expected: 1),
                    Expect.isTrue(test.list.sortDirectionDec),
                  ]),
          TestWithContext('should update name if different',
              action: (test) {
                test['newName'] = 'My very cool list';
                test.list.updateName(test['newName']);
              },
              assertions: (test) => [
                    Expect.equals(actual: test.list.writeCount, expected: 1),
                    Expect.equals(
                        actual: test.list.name, expected: test['newName']),
                  ]),
          TestWithContext('should update name if different',
              action: (test) {
                test.list.updateName(test.list.name);
              },
              assertions: (test) =>
                  [Expect.equals(actual: test.list.writeCount, expected: 0)]),
          TestWithContext('should not update name if empty',
              action: (test) {
                test['previousName'] = 'Cool name do not delete';
                test.list.updateName(test['previousName']);
                test.list.writeCount = 0;
                test.list.updateName('');
              },
              assertions: (test) => [
                    Expect.equals(actual: test.list.writeCount, expected: 0),
                    Expect.equals(
                        actual: test.list.name, expected: test['previousName'])
                  ]),
        ],
        contextBuilder: _TaskListTestContext<TaskListMock>.new,
      ),
      GroupWithContext<List<TaskItem>, _TaskListTestContext<List<TaskItem>>>(
        'Sort Items',
        [
          TestWithContext('should sort by completed with completed last',
              setup: (test) async {
                test.itemA = await test.list.createTaskItem(name: 'Item A');
                test.itemB = await test.list.createTaskItem(name: 'Item B');
                test.itemC = await test.list.createTaskItem(name: 'Item C');
                test.list
                    .taskItemsUpdateComplete(true, [test.itemA, test.itemC]);
                test.list.taskItemsUpdateComplete(true, [test.itemC]);
                test.list.updateSort(SortType.completed);
              },
              action: (test) => test.list.sortTasks(false),
              assertions: (test) => [
                    Expect.equals(
                        actual: test.actual!.first, expected: test.itemB.name),
                    Expect.equals(
                        actual: test.actual![1].name,
                        expected: test.itemA.name),
                    Expect.equals(
                        actual: test.actual![2].name,
                        expected: test.itemB.name),
                  ]),
          TestWithContext('should sort by alphabetical',
              setup: (test) async {
                test.itemA = await test.list.createTaskItem(name: 'Z - Item A');
                test.itemB = await test.list.createTaskItem(name: 'B - Item B');
                test.itemC = await test.list.createTaskItem(name: 'C - Item C');
                test.list.updateSort(SortType.alphabetical);
              },
              action: (test) => test.list.sortTasks(false),
              assertions: (test) => [
                    Expect.equals(
                        actual: test.actual!.first, expected: test.itemB.name),
                    Expect.equals(
                        actual: test.actual![1].name,
                        expected: test.itemC.name),
                    Expect.equals(
                        actual: test.actual![2].name,
                        expected: test.itemA.name),
                  ]),
          TestWithContext('should sort by created date',
              setup: (test) async {
                test.itemA = await test.list.createTaskItem(name: 'Item A');
                test.itemB = await test.list.createTaskItem(name: 'Item B');
                test.itemC = await test.list.createTaskItem(name: 'Item C');
                test.list.updateSort(SortType.created);
              },
              action: (test) => test.list.sortTasks(false),
              assertions: (test) => [
                    Expect.equals(
                        actual: test.actual!.first, expected: test.itemA.name),
                    Expect.equals(
                        actual: test.actual![1].name,
                        expected: test.itemB.name),
                    Expect.equals(
                        actual: test.actual![2].name,
                        expected: test.itemC.name),
                  ]),
          TestWithContext('should sort by due date',
              setup: (test) async {
                test.itemA = await test.list.createTaskItem(name: 'Item A');
                test.itemB = await test.list.createTaskItem(
                    name: 'Item B', dueDate: DateHelper.getToday());
                test.itemC = await test.list.createTaskItem(
                  name: 'Item C',
                  dueDate: DateHelper.getToday().add(const Duration(days: 1)),
                );
                test.list.updateSort(SortType.due);
              },
              action: (test) => test.list.sortTasks(false),
              assertions: (test) => [
                    Expect.equals(
                        actual: test.actual!.first, expected: test.itemB.name),
                    Expect.equals(
                        actual: test.actual![1].name,
                        expected: test.itemC.name),
                    Expect.equals(
                        actual: test.actual![2].name,
                        expected: test.itemA.name),
                  ]),
          TestWithContext('should sort by category',
              setup: (test) async {
                TaskCategory categoryA =
                    await test.list.createTaskCategory('Category A');
                TaskCategory categoryB =
                    await test.list.createTaskCategory('Category B');
                test.itemA = await test.list.createTaskItem(name: 'Item A');
                test.itemB = await test.list
                    .createTaskItem(name: 'Item B', category: categoryB);
                test.itemC = await test.list
                    .createTaskItem(name: 'Item C', category: categoryA);
                test.list.updateSort(SortType.category);
              },
              action: (test) => test.list.sortTasks(false),
              assertions: (test) => [
                    Expect.equals(
                        actual: test.actual!.first, expected: test.itemC.name),
                    Expect.equals(
                        actual: test.actual![1].name,
                        expected: test.itemB.name),
                    Expect.equals(
                        actual: test.actual![2].name,
                        expected: test.itemA.name),
                  ]),
          TestWithContext('should sort by sort order',
              setup: (test) async {
                test.itemA = await test.list.createTaskItem(name: 'Item A');
                test.itemB = await test.list.createTaskItem(name: 'Item B');
                test.itemC = await test.list.createTaskItem(name: 'Item C');
                test.list.updateSort(SortType.none);
                test.list.taskItemChangeSortOrder(0, 1, false);
              },
              action: (test) => test.list.sortTasks(false),
              assertions: (test) => [
                    Expect.equals(
                        actual: test.actual!.first, expected: test.itemB.name),
                    Expect.equals(
                        actual: test.actual![1].name,
                        expected: test.itemA.name),
                    Expect.equals(
                        actual: test.actual![2].name,
                        expected: test.itemC.name),
                  ]),
        ],
        contextBuilder: _TaskListTestContext<List<TaskItem>>.new,
      ),
      GroupWithContext<dynamic, _TaskListTestContext>(
        'Task Item Functions',
        [
          TestWithContext('should create item from form',
              action: (test) async {
                test['newName'] = 'My cool task name';
                test.item =
                    await test.list.createTaskItem(name: test['newName']);
              },
              assertions: (test) => [
                    Expect.equals(actual: test.list.tasks.length, expected: 1),
                    Expect.equals(
                        actual: test.list.history.length, expected: 1),
                    Expect.equals(actual: test.list.writeCount, expected: 1),
                    Expect.equals(
                        actual: test.item.name, expected: test['newName']),
                    Expect.equals(actual: test.item.sortOrder, expected: 0),
                    Expect.isNotNull(test.item.id),
                  ]),
          TestWithContext(
            'should assign the next sort order to new item',
            action: (test) async {
              await test.list.createTaskItem(name: 'Task A');
              test.item = await test.list.createTaskItem(name: 'Task B');
            },
            assertions: (test) => [
              Expect.equals(actual: test.list.tasks.length, expected: 2),
              Expect.equals(actual: test.list.history.length, expected: 2),
              Expect.equals(actual: test.list.writeCount, expected: 2),
              Expect.equals(actual: test.item.sortOrder, expected: 1),
            ],
          ),
          TestWithContext('remove - should remove task items',
              setup: (test) async {
                test.itemA = await test.list.createTaskItem(name: 'Task A');
                test.itemB = await test.list.createTaskItem(name: 'Task B');
                test.itemC = await test.list.createTaskItem(name: 'Task C');
                test.list.writeCount = 0;
              },
              action: (test) async {
                await test.list.removeTaskItems([test.itemA, test.itemC]);
              },
              assertions: (test) => [
                    Expect.equals(actual: test.list.writeCount, expected: 1),
                    Expect.equals(actual: test.list.tasks.length, expected: 1),
                    Expect.equals(
                        actual: test.list.getTaskFromId(test.itemB.id),
                        expected: test.itemB),
                  ]),
          TestWithContext('remove - should undo removing task items',
              setup: (test) async {
                test.itemA = await test.list.createTaskItem(name: 'Task A');
                test.itemB = await test.list.createTaskItem(name: 'Task B');
                test.itemC = await test.list.createTaskItem(name: 'Task C');
                await test.list.removeTaskItems([test.itemA, test.itemC]);
                test.list.writeCount = 0;
              },
              action: (test) async {
                test.list.undoRemoveTaskItems([test.itemA, test.itemC]);
              },
              assertions: (test) => [
                    Expect.equals(actual: test.list.writeCount, expected: 1),
                    Expect.equals(actual: test.list.tasks.length, expected: 3),
                    Expect.equals(
                        actual: test.list.getTaskFromId(test.itemA.id),
                        expected: test.itemA),
                    Expect.equals(
                        actual: test.list.getTaskFromId(test.itemB.id),
                        expected: test.itemB),
                    Expect.equals(
                        actual: test.list.getTaskFromId(test.itemB.id),
                        expected: test.itemB),
                  ]),
          TestWithContext('complete - should update for items',
              setup: (test) async {
                test.item =
                    await test.list.createTaskItem(name: 'Soon to be complete');
                test.list.writeCount = 0;
              },
              action: (test) async {
                test.list.taskItemsUpdateComplete(true, [test.item]);
              },
              assertions: (test) => [
                    Expect.isTrue(test.item.complete),
                    Expect.equals(actual: test.list.writeCount, expected: 1),
                    Expect.equals(
                        actual: test.list.history.length, expected: 2),
                  ]),
          TestWithContext(
              'complete - should not do anything if no updates were made',
              setup: (test) async {
                test.item =
                    await test.list.createTaskItem(name: 'Soon to be complete');
                test.list.writeCount = 0;
              },
              action: (test) async {
                // By default complete is false so this should do nothing
                test.list.taskItemsUpdateComplete(false, [test.item]);
              },
              assertions: (test) => [
                    Expect.isFalse(test.item.complete),
                    Expect.equals(actual: test.list.writeCount, expected: 0),
                    Expect.equals(
                        actual: test.list.history.length, expected: 1),
                  ]),
          TestWithContext('move - should move items to another list',
              setup: (test) async {
                test['newList'] = TaskListMock();
                test.item =
                    await test.list.createTaskItem(name: 'Soon to be moved');
                test.list.writeCount = 0;
              },
              action: (test) async {
                await test.list
                    .moveTaskItemsToNewList(test['newList'], [test.item]);
              },
              assertions: (test) => [
                    Expect.equals(actual: test.list.writeCount, expected: 1),
                    Expect.equals(
                        actual: test['newList'].writeCount, expected: 1),
                    Expect.equals(actual: test.list.tasks.length, expected: 0),
                    Expect.equals(
                        actual: test['newList'].tasks.length, expected: 1),
                    Expect.isNotNull(
                        test['newList'].getTaskFromId(test.item.id)),
                    Expect.equals(
                        actual: test.list.history.length, expected: 2),
                    Expect.equals(
                        actual: test['newList'].history.length, expected: 1),
                  ]),
          TestWithContext('category - should update item category',
              setup: (test) async {
                test.category =
                    await test.list.createTaskCategory('New Category');
                test.item = await test.list
                    .createTaskItem(name: 'To be added to category');
                test.list.writeCount = 0;
              },
              action: (test) async {
                await test.list
                    .taskItemUpdateCategory(test.category, test.item);
              },
              assertions: (test) => [
                    Expect.equals(actual: test.list.writeCount, expected: 1),
                    Expect.equals(
                        actual: test.item.category, expected: test.category),
                    Expect.equals(
                        actual: test.list.history.length, expected: 2),
                  ]),
          TestWithContext(
              'category - should not do anything if no updates were made',
              setup: (test) async {
                test.category =
                    await test.list.createTaskCategory('New Category');
                test.item = await test.list
                    .createTaskItem(name: 'To be added to category');
                await test.list
                    .taskItemUpdateCategory(test.category, test.item);
                test.list.writeCount = 0;
              },
              action: (test) async {
                await test.list
                    .taskItemUpdateCategory(test.category, test.item);
              },
              assertions: (test) => [
                    Expect.equals(actual: test.list.writeCount, expected: 0),
                    Expect.equals(
                        actual: test.list.history.length, expected: 2),
                  ]),
          TestWithContext('name - should update item name',
              setup: (test) async {
                test.item =
                    await test.list.createTaskItem(name: 'Original name');
                test.list.writeCount = 0;
              },
              action: (test) async {
                test['newName'] = 'New Name';
                await test.list.taskItemUpdateName(test['newName'], test.item);
              },
              assertions: (test) => [
                    Expect.equals(actual: test.list.writeCount, expected: 1),
                    Expect.equals(
                        actual: test.item.name, expected: test['newName']),
                    Expect.equals(
                        actual: test.list.history.length, expected: 2),
                  ]),
          TestWithContext(
              'name - should not do anything if no updates were made',
              setup: (test) async {
                test.item =
                    await test.list.createTaskItem(name: 'Original name');
                test.list.writeCount = 0;
              },
              action: (test) async {
                await test.list.taskItemUpdateName(test.item.name, test.item);
              },
              assertions: (test) => [
                    Expect.equals(actual: test.list.writeCount, expected: 0),
                    Expect.equals(
                        actual: test.list.history.length, expected: 2),
                  ]),
          TestWithContext('due date - should update item due date',
              setup: (test) async {
                test.item = await test.list.createTaskItem(
                    name: 'soon to be due', dueDate: DateHelper.getToday());
                test.list.writeCount = 0;
              },
              action: (test) async {
                test['newDueDate'] =
                    DateHelper.getToday().add(const Duration(days: 3));
                await test.list
                    .taskItemUpdateDueDate(test['newDueDate'], test.item);
              },
              assertions: (test) => [
                    Expect.equals(actual: test.list.writeCount, expected: 1),
                    Expect.equals(
                        actual: test.item.dueDate,
                        expected: test['newDueDate']),
                    Expect.equals(
                        actual: test.list.history.length, expected: 2),
                  ]),
          TestWithContext(
              'due date - should not do anything if no updates were made',
              setup: (test) async {
                test.item = await test.list.createTaskItem(
                    name: 'due in three days',
                    dueDate:
                        DateHelper.getToday().add(const Duration(days: 3)));
                test.list.writeCount = 0;
              },
              action: (test) async {
                await test.list
                    .taskItemUpdateDueDate(test.item.dueDate, test.item);
              },
              assertions: (test) => [
                    Expect.equals(actual: test.list.writeCount, expected: 0),
                    Expect.equals(
                        actual: test.list.history.length, expected: 1),
                  ]),
          TestWithContext('description - should update item description',
              setup: (test) async {
                test.item = await test.list.createTaskItem(
                    name: 'item with description',
                    description: 'Original description');
                test.list.writeCount = 0;
              },
              action: (test) async {
                test['newDescription'] = 'New description';
                await test.list.taskItemUpdateDescription(
                    test['newDescription'], test.item);
              },
              assertions: (test) => [
                    Expect.equals(actual: test.list.writeCount, expected: 1),
                    Expect.equals(
                        actual: test.item.description,
                        expected: test['newDescription']),
                    Expect.equals(
                        actual: test.list.history.length, expected: 2),
                  ]),
          TestWithContext(
              'description - should not do anything if no update were made',
              setup: (test) async {
                test.item = await test.list.createTaskItem(
                    name: 'item with description',
                    description: 'Original description');
                test.list.writeCount = 0;
              },
              action: (test) async {
                await test.list.taskItemUpdateDescription(
                    test.item.description, test.item);
              },
              assertions: (test) => [
                    Expect.equals(actual: test.list.writeCount, expected: 0),
                    Expect.equals(
                        actual: test.list.history.length, expected: 1),
                  ]),
          TestWithContext(
              'should allow sort order to be rearranged - moving an item downwards',
              setup: (test) async {
                test.itemA = await test.list.createTaskItem(name: 'Item A');
                test.itemB = await test.list.createTaskItem(name: 'Item B');
                test.itemC = await test.list.createTaskItem(name: 'Item C');
                test.list.writeCount = 0;
              },
              action: (test) async {
                await test.list.taskItemChangeSortOrder(0, 1, false);
              },
              assertions: (test) => [
                    Expect.equals(actual: test.list.writeCount, expected: 1),
                    Expect.equals(actual: test.itemA.sortOrder, expected: 1),
                    Expect.equals(actual: test.itemB.sortOrder, expected: 0),
                    Expect.equals(actual: test.itemC.sortOrder, expected: 2),
                  ]),
          TestWithContext(
              'should allow sort order to be rearranged - moving an item upwards',
              setup: (test) async {
                test.itemA = await test.list.createTaskItem(name: 'Item A');
                test.itemB = await test.list.createTaskItem(name: 'Item B');
                test.itemC = await test.list.createTaskItem(name: 'Item C');
                test.list.writeCount = 0;
              },
              action: (test) async {
                await test.list.taskItemChangeSortOrder(1, 0, false);
              },
              assertions: (test) => [
                    Expect.equals(actual: test.list.writeCount, expected: 1),
                    Expect.equals(actual: test.itemA.sortOrder, expected: 1),
                    Expect.equals(actual: test.itemB.sortOrder, expected: 0),
                    Expect.equals(actual: test.itemC.sortOrder, expected: 2),
                  ]),
          TestWithContext('task tag add - should add tag to task item',
              setup: (test) async {
                test.item =
                    await test.list.createTaskItem(name: 'Soon to be tagged');
                test.list.writeCount = 0;
              },
              action: (test) async {
                await test.list.addTagFromTaskItem(test.tag, test.item);
              },
              assertions: (test) => [
                    Expect.equals(actual: test.list.writeCount, expected: 1),
                    Expect.isNotNull(test.item.tags[test.tag.id]),
                    Expect.equals(
                        actual: test.list.history.length, expected: 2),
                  ]),
          TestWithContext(
              'task tag add - should not do anything if no updates were made',
              setup: (test) async {
                test.item =
                    await test.list.createTaskItem(name: 'Soon to be tagged');
                test.list.writeCount = 0;
                await test.list.addTagFromTaskItem(test.tag, test.item);
              },
              action: (test) async {
                await test.list.addTagFromTaskItem(test.tag, test.item);
              },
              assertions: (test) => [
                    Expect.equals(actual: test.list.writeCount, expected: 0),
                    Expect.equals(actual: test.item.tags.length, expected: 1),
                    Expect.equals(
                        actual: test.list.history.length, expected: 2),
                  ]),
          TestWithContext(
              'task tag remove - should not do anything if tag is not on item',
              setup: (test) async {
                test.item =
                    await test.list.createTaskItem(name: 'Is Not Tagged');
                test.list.writeCount = 0;
              },
              action: (test) async {
                await test.list.removeTagFromTaskItem(test.tag, test.item);
              },
              assertions: (test) => [
                    Expect.equals(actual: test.list.writeCount, expected: 0),
                    Expect.isTrue(test.item.tags.isEmpty),
                    Expect.equals(
                        actual: test.list.history.length, expected: 1),
                  ]),
        ],
        contextBuilder: _TaskListTestContext.new,
      ),
      GroupWithContext<List<TaskHistory>,
          _TaskListTestContext<List<TaskHistory>>>(
        'Task History',
        [
          TestWithContext(
            'get a list of history items for a specific item',
            setup: (test) async {
              test.item = await test.list.createTaskItem(name: 'Item A');
              await test.list.createTaskItem(name: 'Item B');
            },
            action: (test) => test.list.getHistoryForItem(test.item),
            assertions: (test) => [
              Expect.equals(actual: test.actual!.length, expected: 1),
              Expect.equals(
                  actual: test.actual!.first.taskId, expected: test.item.id),
            ],
            contextBuilder: _TaskListTestContext.new,
          ),
        ],
        contextBuilder: _TaskListTestContext<List<TaskHistory>>.new,
      ),
    ],
    contextBuilder: _TaskListTestContext<dynamic>.new,
  );
}

class _TaskListTestContext<T> extends Context<T> {
  late TaskListMock list = TaskListMock();
  final Map<String, dynamic> mockMapBasic = {
    TaskListProperties.id: '',
    TaskListProperties.name: 'My awesome list',
    TaskListProperties.sortMode: 'sortType.none',
    TaskListProperties.sortDirectionDec: false,
    TaskListProperties.taskItems: [],
    TaskListProperties.categories: [],
    TaskListProperties.history: [],
  };
  late TaskItem item;
  late TaskItem itemA;
  late TaskItem itemB;
  late TaskItem itemC;
  late TaskCategory category;
  late TagMock tag = TagMock();
}
