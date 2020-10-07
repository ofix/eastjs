<template>
  <el-container>
    <el-aside width="200px"> 左侧菜单 </el-aside>
    <el-container>
      <el-main>中间内容</el-main>
    </el-container>
  </el-container>
</template>

<script>
export default {
  name: "pdf-printer",
  methods: {
    open(link) {
      this.$electron.shell.openExternal(link);
    },
  },
};
</script>

<style scoped>
.el-aside {
  background-color: #d3dce6;
  color: #333;
  text-align: center;
  line-height: 200px;
}
.el-main {
  background-color: #e9eef3;
  color: #333;
  text-align: center;
  line-height: 160px;
}
</style>