

$('.number-spinner').bootstrapNumber();

var cubeGUI = angular.module('cubeGUI', []);

cubeGUI.controller('cubeGUIController', function ($scope) {
    $scope.scramble = function(){ call_scramble(); };
    $scope.reset = function(){ call_reset(); };
    $scope.dimension = 3;
});